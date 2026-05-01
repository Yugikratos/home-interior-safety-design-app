from typing import List

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel


app = FastAPI(title="Blueprint Processor", version="0.1.0")


class Detection(BaseModel):
    xPercent: float
    yPercent: float
    widthPercent: float
    heightPercent: float
    confidence: float


def merge_nearby_lines(lines: np.ndarray | None, threshold: int = 12) -> list[tuple[int, int, int, int]]:
    if lines is None:
        return []

    horizontal: list[tuple[int, int, int, int]] = []
    vertical: list[tuple[int, int, int, int]] = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if abs(y2 - y1) <= abs(x2 - x1):
            horizontal.append((min(x1, x2), int((y1 + y2) / 2), max(x1, x2), int((y1 + y2) / 2)))
        else:
            vertical.append((int((x1 + x2) / 2), min(y1, y2), int((x1 + x2) / 2), max(y1, y2)))

    def merge_axis(axis_lines: list[tuple[int, int, int, int]], horizontal_axis: bool) -> list[tuple[int, int, int, int]]:
        merged: list[tuple[int, int, int, int]] = []
        axis_lines.sort(key=lambda item: item[1] if horizontal_axis else item[0])
        for current in axis_lines:
            if not merged:
                merged.append(current)
                continue
            previous = merged[-1]
            previous_axis = previous[1] if horizontal_axis else previous[0]
            current_axis = current[1] if horizontal_axis else current[0]
            if abs(previous_axis - current_axis) <= threshold:
                if horizontal_axis:
                    y = int((previous[1] + current[1]) / 2)
                    merged[-1] = (min(previous[0], current[0]), y, max(previous[2], current[2]), y)
                else:
                    x = int((previous[0] + current[0]) / 2)
                    merged[-1] = (x, min(previous[1], current[1]), x, max(previous[3], current[3]))
            else:
                merged.append(current)
        return merged

    return merge_axis(horizontal, True) + merge_axis(vertical, False)


def detection_confidence(area: float, image_area: float, rectangularity: float, corners: int) -> float:
    area_score = min(1.0, max(0.2, area / (image_area * 0.08)))
    corner_score = 1.0 if corners == 4 else 0.78 if 4 < corners <= 8 else 0.62
    return min(0.98, max(0.35, (rectangularity * 0.55) + (area_score * 0.3) + (corner_score * 0.15)))


def overlaps_existing(box: tuple[int, int, int, int], boxes: list[tuple[int, int, int, int]]) -> bool:
    x, y, width, height = box
    area = width * height
    for existing in boxes:
        ex, ey, ew, eh = existing
        overlap_width = max(0, min(x + width, ex + ew) - max(x, ex))
        overlap_height = max(0, min(y + height, ey + eh) - max(y, ey))
        overlap = overlap_width * overlap_height
        if overlap > area * 0.55:
            return True
    return False


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/process-blueprint", response_model=List[Detection])
async def process_blueprint(file: UploadFile = File(...)) -> list[Detection]:
    if file.content_type not in {"image/png", "image/jpeg", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Only PNG and JPG blueprint images are supported")

    content = await file.read()
    image_bytes = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode blueprint image")

    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    dilated_edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    lines = cv2.HoughLinesP(dilated_edges, 1, np.pi / 180, threshold=75, minLineLength=max(35, min(width, height) // 12), maxLineGap=12)
    wall_mask = np.zeros_like(gray)
    for x1, y1, x2, y2 in merge_nearby_lines(lines):
        cv2.line(wall_mask, (x1, y1), (x2, y2), 255, 4)

    room_mask = cv2.morphologyEx(cv2.bitwise_or(dilated_edges, wall_mask), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8), iterations=2)
    contours, _ = cv2.findContours(room_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    detections: list[Detection] = []
    accepted_boxes: list[tuple[int, int, int, int]] = []
    image_area = float(width * height)

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < image_area * 0.004 or area > image_area * 0.7:
            continue

        x, y, box_width, box_height = cv2.boundingRect(contour)
        if box_width < width * 0.04 or box_height < height * 0.04:
            continue

        aspect_ratio = box_width / max(box_height, 1)
        if aspect_ratio < 0.25 or aspect_ratio > 4:
            continue

        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.03 * perimeter, True)
        rectangularity = area / float(box_width * box_height)
        if rectangularity < 0.42 or len(approx) > 10:
            continue
        if overlaps_existing((x, y, box_width, box_height), accepted_boxes):
            continue

        confidence = detection_confidence(area, image_area, rectangularity, len(approx))
        accepted_boxes.append((x, y, box_width, box_height))

        detections.append(Detection(
            xPercent=round((x / width) * 100, 2),
            yPercent=round((y / height) * 100, 2),
            widthPercent=round((box_width / width) * 100, 2),
            heightPercent=round((box_height / height) * 100, 2),
            confidence=round(confidence, 2),
        ))

    detections.sort(key=lambda item: item.confidence, reverse=True)
    return detections[:12]
