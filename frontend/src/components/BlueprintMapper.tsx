import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Blueprint, FurnitureItem, Room, RoomLayoutScore } from '../types';

type Draft = { x: number; y: number; width: number; height: number };
type ImageFrame = { left: number; top: number; width: number; height: number };
type MapperMode = 'trace' | 'map';
type ResizeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Guide = { orientation: 'vertical' | 'horizontal'; position: number };
type RoomInteraction = {
  roomId: number;
  kind: 'move' | 'resize';
  corner?: ResizeCorner;
  startPoint: { x: number; y: number };
  startMapping: Draft;
  currentMapping: Draft;
  aspectRatio: number;
};
type FurnitureInteraction = {
  roomId: number;
  furnitureId: number;
  kind: 'move' | 'resize' | 'rotate';
  corner?: ResizeCorner;
  roomRect: { left: number; top: number; width: number; height: number };
  startPoint: { x: number; y: number };
  startFurniture: FurnitureItem;
  currentFurniture: FurnitureItem;
};

const minRoomSize = 2;
const minFurnitureSize = 6;
const furnitureOptions = ['Bed', 'Sofa', 'Table', 'Wardrobe', 'TV unit'];
const gridStep = 2.5;
const snapThresholdPx = 8;
const collisionThreshold = 0.2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasMapping(room: Room) {
  return room.mapX != null && room.mapY != null && room.mapWidth != null && room.mapHeight != null;
}

function furnitureClass(type: string) {
  return type.toLowerCase().replace(/\s+/g, '-');
}

function furnitureWithDefaults(item: FurnitureItem): FurnitureItem {
  return { ...item, rotationAngle: item.rotationAngle ?? 0 };
}

export function BlueprintMapper({ token, projectId, blueprint, rooms, focusRoomId, onMapped }: {
  token: string;
  projectId: number;
  blueprint?: Blueprint | null;
  rooms: Room[];
  focusRoomId: number | null;
  onMapped: () => void;
}) {
  const [blueprintUrl, setBlueprintUrl] = useState('');
  const [mode, setMode] = useState<MapperMode>('trace');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(rooms[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [mappingOverrides, setMappingOverrides] = useState<Record<number, Draft>>({});
  const [furnitureOverrides, setFurnitureOverrides] = useState<Record<number, FurnitureItem>>({});
  const [alignmentGuides, setAlignmentGuides] = useState<Guide[]>([]);
  const [collisionRoomId, setCollisionRoomId] = useState<number | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<number | null>(null);
  const [traceName, setTraceName] = useState('');
  const [traceType, setTraceType] = useState('Bedroom');
  const [traceLength, setTraceLength] = useState(12);
  const [traceWidth, setTraceWidth] = useState(10);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageFrame, setImageFrame] = useState<ImageFrame>({ left: 0, top: 0, width: 0, height: 0 });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [arranging, setArranging] = useState(false);
  const [layoutScore, setLayoutScore] = useState<RoomLayoutScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<RoomInteraction | null>(null);
  const furnitureInteractionRef = useRef<FurnitureInteraction | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const isImage = blueprint?.contentType?.startsWith('image/');

  const updateImageFrame = useCallback(() => {
    const surface = surfaceRef.current;
    const image = imageRef.current;
    if (!surface || !image || image.naturalWidth === 0 || image.naturalHeight === 0) {
      setImageFrame({ left: 0, top: 0, width: 0, height: 0 });
      return;
    }

    const surfaceRect = surface.getBoundingClientRect();
    const surfaceRatio = surfaceRect.width / surfaceRect.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    let width = surfaceRect.width;
    let height = surfaceRect.height;
    let left = 0;
    let top = 0;

    if (surfaceRatio > imageRatio) {
      width = surfaceRect.height * imageRatio;
      left = (surfaceRect.width - width) / 2;
    } else {
      height = surfaceRect.width / imageRatio;
      top = (surfaceRect.height - height) / 2;
    }

    setImageFrame({ left, top, width, height });
  }, []);

  useEffect(() => {
    setSelectedRoomId((current) => current ?? rooms[0]?.id ?? null);
  }, [rooms]);

  useEffect(() => {
    if (focusRoomId == null) return;
    setMode('map');
    setSelectedRoomId(focusRoomId);
    setDraft(null);
    setStatus('Draw a rectangle over the blueprint, then save mapping for this room.');
  }, [focusRoomId]);

  useEffect(() => {
    setBlueprintUrl('');
    setError('');
    if (!blueprint || !isImage) return;
    let objectUrl = '';
    api.blueprintFile(token, projectId)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlueprintUrl(objectUrl);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load blueprint for mapping'));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blueprint, isImage, projectId, token]);

  useEffect(() => {
    updateImageFrame();
    const surface = surfaceRef.current;
    if (!surface) return;

    const observer = new ResizeObserver(updateImageFrame);
    observer.observe(surface);
    window.addEventListener('resize', updateImageFrame);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateImageFrame);
    };
  }, [blueprintUrl, updateImageFrame]);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  const mappedRooms = rooms.filter(hasMapping);
  const getRoomMapping = useCallback((room: Room): Draft => mappingOverrides[room.id] ?? {
    x: room.mapX ?? 0,
    y: room.mapY ?? 0,
    width: room.mapWidth ?? 0,
    height: room.mapHeight ?? 0
  }, [mappingOverrides]);
  const furnitureForRoom = useCallback((room: Room) => (room.furniture ?? []).map((item) => furnitureWithDefaults(furnitureOverrides[item.id] ?? item)), [furnitureOverrides]);
  const shownDraft = draft ?? (mode === 'map' && selectedRoom && hasMapping(selectedRoom)
    ? getRoomMapping(selectedRoom)
    : null);
  const issueTypeByFurnitureId = new Map<number, 'warning' | 'improve' | 'suggestion'>();
  layoutScore?.suggestions.forEach((suggestion) => {
    suggestion.furnitureIds.forEach((id) => {
      const current = issueTypeByFurnitureId.get(id);
      if (current === 'warning') return;
      issueTypeByFurnitureId.set(id, suggestion.type);
    });
  });

  const pointFromClient = useCallback((clientX: number, clientY: number) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
    };
  }, []);

  function pointFromEvent(event: React.PointerEvent<HTMLElement>) {
    return pointFromClient(event.clientX, event.clientY);
  }

  function clampMapping(mapping: Draft): Draft {
    const width = clamp(mapping.width, minRoomSize, 100);
    const height = clamp(mapping.height, minRoomSize, 100);
    return {
      x: clamp(mapping.x, 0, 100 - width),
      y: clamp(mapping.y, 0, 100 - height),
      width,
      height
    };
  }

  function edgesOf(mapping: Draft) {
    return {
      left: mapping.x,
      centerX: mapping.x + mapping.width / 2,
      right: mapping.x + mapping.width,
      top: mapping.y,
      centerY: mapping.y + mapping.height / 2,
      bottom: mapping.y + mapping.height
    };
  }

  function snapValue(value: number, targets: number[], threshold: number) {
    let best = value;
    let bestDelta = threshold;
    targets.forEach((target) => {
      const delta = Math.abs(value - target);
      if (delta <= bestDelta) {
        best = target;
        bestDelta = delta;
      }
    });
    return best;
  }

  function collectSnapTargets(roomId: number) {
    const vertical = [0, 100];
    const horizontal = [0, 100];
    rooms.filter((room) => room.id !== roomId && hasMapping(room)).forEach((room) => {
      const edge = edgesOf(getRoomMapping(room));
      vertical.push(edge.left, edge.centerX, edge.right);
      horizontal.push(edge.top, edge.centerY, edge.bottom);
    });
    return { vertical, horizontal };
  }

  function snapToGrid(mapping: Draft): Draft {
    return {
      x: Math.round(mapping.x / gridStep) * gridStep,
      y: Math.round(mapping.y / gridStep) * gridStep,
      width: Math.round(mapping.width / gridStep) * gridStep,
      height: Math.round(mapping.height / gridStep) * gridStep
    };
  }

  function applySnapping(roomId: number, mapping: Draft, kind: 'move' | 'resize', corner?: ResizeCorner) {
    const imageRect = imageRef.current?.getBoundingClientRect();
    const thresholdX = imageRect ? (snapThresholdPx / imageRect.width) * 100 : 1;
    const thresholdY = imageRect ? (snapThresholdPx / imageRect.height) * 100 : 1;
    const targets = collectSnapTargets(roomId);
    let next = clampMapping(snapToGrid(mapping));
    const guides: Guide[] = [];
    const edge = edgesOf(next);

    if (kind === 'move') {
      const snappedLeft = snapValue(edge.left, targets.vertical, thresholdX);
      const snappedRight = snapValue(edge.right, targets.vertical, thresholdX);
      const snappedCenterX = snapValue(edge.centerX, targets.vertical, thresholdX);
      if (snappedLeft !== edge.left) {
        next.x = snappedLeft;
        guides.push({ orientation: 'vertical', position: snappedLeft });
      } else if (snappedRight !== edge.right) {
        next.x = snappedRight - next.width;
        guides.push({ orientation: 'vertical', position: snappedRight });
      } else if (snappedCenterX !== edge.centerX) {
        next.x = snappedCenterX - next.width / 2;
        guides.push({ orientation: 'vertical', position: snappedCenterX });
      }

      const snappedTop = snapValue(edge.top, targets.horizontal, thresholdY);
      const snappedBottom = snapValue(edge.bottom, targets.horizontal, thresholdY);
      const snappedCenterY = snapValue(edge.centerY, targets.horizontal, thresholdY);
      if (snappedTop !== edge.top) {
        next.y = snappedTop;
        guides.push({ orientation: 'horizontal', position: snappedTop });
      } else if (snappedBottom !== edge.bottom) {
        next.y = snappedBottom - next.height;
        guides.push({ orientation: 'horizontal', position: snappedBottom });
      } else if (snappedCenterY !== edge.centerY) {
        next.y = snappedCenterY - next.height / 2;
        guides.push({ orientation: 'horizontal', position: snappedCenterY });
      }
      return { mapping: clampMapping(next), guides };
    }

    const right = next.x + next.width;
    const bottom = next.y + next.height;
    if (corner?.includes('left')) {
      const snappedLeft = snapValue(next.x, targets.vertical, thresholdX);
      if (snappedLeft !== next.x && snappedLeft < right - minRoomSize) {
        next.width = right - snappedLeft;
        next.x = snappedLeft;
        guides.push({ orientation: 'vertical', position: snappedLeft });
      }
    }
    if (corner?.includes('right')) {
      const snappedRight = snapValue(right, targets.vertical, thresholdX);
      if (snappedRight !== right && snappedRight > next.x + minRoomSize) {
        next.width = snappedRight - next.x;
        guides.push({ orientation: 'vertical', position: snappedRight });
      }
    }
    if (corner?.includes('top')) {
      const snappedTop = snapValue(next.y, targets.horizontal, thresholdY);
      if (snappedTop !== next.y && snappedTop < bottom - minRoomSize) {
        next.height = bottom - snappedTop;
        next.y = snappedTop;
        guides.push({ orientation: 'horizontal', position: snappedTop });
      }
    }
    if (corner?.includes('bottom')) {
      const snappedBottom = snapValue(bottom, targets.horizontal, thresholdY);
      if (snappedBottom !== bottom && snappedBottom > next.y + minRoomSize) {
        next.height = snappedBottom - next.y;
        guides.push({ orientation: 'horizontal', position: snappedBottom });
      }
    }
    return { mapping: clampMapping(next), guides };
  }

  function hasHeavyOverlap(roomId: number, mapping: Draft) {
    return rooms.filter((room) => room.id !== roomId && hasMapping(room)).some((room) => {
      const other = getRoomMapping(room);
      const overlapWidth = Math.max(0, Math.min(mapping.x + mapping.width, other.x + other.width) - Math.max(mapping.x, other.x));
      const overlapHeight = Math.max(0, Math.min(mapping.y + mapping.height, other.y + other.height) - Math.max(mapping.y, other.y));
      const overlapArea = overlapWidth * overlapHeight;
      const roomArea = Math.max(mapping.width * mapping.height, 1);
      return overlapArea / roomArea > collisionThreshold;
    });
  }

  function clampFurniture(item: FurnitureItem): FurnitureItem {
    const widthPercent = clamp(item.widthPercent, minFurnitureSize, 100);
    const heightPercent = clamp(item.heightPercent, minFurnitureSize, 100);
    return {
      ...item,
      xPercent: clamp(item.xPercent, 0, 100 - widthPercent),
      yPercent: clamp(item.yPercent, 0, 100 - heightPercent),
      widthPercent,
      heightPercent,
      rotationAngle: item.rotationAngle ?? 0
    };
  }

  function snapFurniture(item: FurnitureItem): FurnitureItem {
    const snapped = { ...item };
    const edges = {
      left: item.xPercent,
      centerX: item.xPercent + item.widthPercent / 2,
      right: item.xPercent + item.widthPercent,
      top: item.yPercent,
      centerY: item.yPercent + item.heightPercent / 2,
      bottom: item.yPercent + item.heightPercent
    };
    const targets = [0, 50, 100];
    const threshold = 2;
    const snappedLeft = snapValue(edges.left, targets, threshold);
    const snappedRight = snapValue(edges.right, targets, threshold);
    const snappedCenterX = snapValue(edges.centerX, targets, threshold);
    if (snappedLeft !== edges.left) snapped.xPercent = snappedLeft;
    else if (snappedRight !== edges.right) snapped.xPercent = snappedRight - item.widthPercent;
    else if (snappedCenterX !== edges.centerX) snapped.xPercent = snappedCenterX - item.widthPercent / 2;

    const snappedTop = snapValue(edges.top, targets, threshold);
    const snappedBottom = snapValue(edges.bottom, targets, threshold);
    const snappedCenterY = snapValue(edges.centerY, targets, threshold);
    if (snappedTop !== edges.top) snapped.yPercent = snappedTop;
    else if (snappedBottom !== edges.bottom) snapped.yPercent = snappedBottom - item.heightPercent;
    else if (snappedCenterY !== edges.centerY) snapped.yPercent = snappedCenterY - item.heightPercent / 2;
    return clampFurniture(snapped);
  }

  const persistRoomMapping = useCallback(async (roomId: number, mapping: Draft) => {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;
    setError('');
    try {
      await api.updateRoom(token, projectId, room.id, {
        name: room.name,
        type: room.type,
        length: room.length,
        width: room.width,
        mapX: Number(mapping.x.toFixed(2)),
        mapY: Number(mapping.y.toFixed(2)),
        mapWidth: Number(mapping.width.toFixed(2)),
        mapHeight: Number(mapping.height.toFixed(2))
      });
      setStatus('Room mapping updated.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update room mapping');
    }
  }, [onMapped, projectId, rooms, token]);

  const persistFurniture = useCallback(async (roomId: number, furniture: FurnitureItem) => {
    setError('');
    try {
      await api.updateFurniture(token, projectId, roomId, furniture.id, {
        type: furniture.type,
        xPercent: Number(furniture.xPercent.toFixed(2)),
        yPercent: Number(furniture.yPercent.toFixed(2)),
        widthPercent: Number(furniture.widthPercent.toFixed(2)),
        heightPercent: Number(furniture.heightPercent.toFixed(2)),
        rotationAngle: Number((furniture.rotationAngle ?? 0).toFixed(2))
      });
      setStatus('Furniture position updated.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update furniture position');
    }
  }, [onMapped, projectId, token]);

  useEffect(() => {
    function updateInteraction(event: PointerEvent) {
      const furnitureInteraction = furnitureInteractionRef.current;
      if (furnitureInteraction) {
        event.preventDefault();
        const point = {
          x: ((event.clientX - furnitureInteraction.roomRect.left) / furnitureInteraction.roomRect.width) * 100,
          y: ((event.clientY - furnitureInteraction.roomRect.top) / furnitureInteraction.roomRect.height) * 100
        };
        const deltaX = point.x - furnitureInteraction.startPoint.x;
        const deltaY = point.y - furnitureInteraction.startPoint.y;
        const start = furnitureInteraction.startFurniture;
        let next: FurnitureItem;
        if (furnitureInteraction.kind === 'move') {
          next = snapFurniture({
            ...start,
            xPercent: start.xPercent + deltaX,
            yPercent: start.yPercent + deltaY
          });
        } else if (furnitureInteraction.kind === 'resize') {
          const left = furnitureInteraction.corner?.includes('left') ? start.xPercent + deltaX : start.xPercent;
          const top = furnitureInteraction.corner?.includes('top') ? start.yPercent + deltaY : start.yPercent;
          const right = furnitureInteraction.corner?.includes('right') ? start.xPercent + start.widthPercent + deltaX : start.xPercent + start.widthPercent;
          const bottom = furnitureInteraction.corner?.includes('bottom') ? start.yPercent + start.heightPercent + deltaY : start.yPercent + start.heightPercent;
          const nextLeft = clamp(Math.min(left, right - minFurnitureSize), 0, 100 - minFurnitureSize);
          const nextTop = clamp(Math.min(top, bottom - minFurnitureSize), 0, 100 - minFurnitureSize);
          next = clampFurniture({
            ...start,
            xPercent: nextLeft,
            yPercent: nextTop,
            widthPercent: clamp(right - nextLeft, minFurnitureSize, 100 - nextLeft),
            heightPercent: clamp(bottom - nextTop, minFurnitureSize, 100 - nextTop)
          });
        } else {
          const centerX = furnitureInteraction.roomRect.left + ((start.xPercent + start.widthPercent / 2) / 100) * furnitureInteraction.roomRect.width;
          const centerY = furnitureInteraction.roomRect.top + ((start.yPercent + start.heightPercent / 2) / 100) * furnitureInteraction.roomRect.height;
          const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI) + 90;
          next = { ...start, rotationAngle: Math.round(angle / 5) * 5 };
        }
        furnitureInteraction.currentFurniture = next;
        if (frameRequestRef.current != null) return;
        frameRequestRef.current = window.requestAnimationFrame(() => {
          frameRequestRef.current = null;
          setFurnitureOverrides((current) => ({ ...current, [furnitureInteraction.furnitureId]: furnitureInteraction.currentFurniture }));
        });
        return;
      }

      const interaction = interactionRef.current;
      if (!interaction) return;
      event.preventDefault();
      const point = pointFromClient(event.clientX, event.clientY);
      const deltaX = point.x - interaction.startPoint.x;
      const deltaY = point.y - interaction.startPoint.y;
      const start = interaction.startMapping;
      let next: Draft;

      if (interaction.kind === 'move') {
        next = clampMapping({
          ...start,
          x: start.x + deltaX,
          y: start.y + deltaY
        });
      } else {
        const left = interaction.corner?.includes('left') ? start.x + deltaX : start.x;
        const top = interaction.corner?.includes('top') ? start.y + deltaY : start.y;
        const right = interaction.corner?.includes('right') ? start.x + start.width + deltaX : start.x + start.width;
        const bottom = interaction.corner?.includes('bottom') ? start.y + start.height + deltaY : start.y + start.height;
        const normalizedLeft = clamp(Math.min(left, right - minRoomSize), 0, 100 - minRoomSize);
        const normalizedTop = clamp(Math.min(top, bottom - minRoomSize), 0, 100 - minRoomSize);
        next = clampMapping({
          x: normalizedLeft,
          y: normalizedTop,
          width: clamp(right - normalizedLeft, minRoomSize, 100 - normalizedLeft),
          height: clamp(bottom - normalizedTop, minRoomSize, 100 - normalizedTop)
        });
        if (event.shiftKey) {
          const ratioHeight = next.width / interaction.aspectRatio;
          const ratioWidth = next.height * interaction.aspectRatio;
          if (Math.abs(ratioHeight - next.height) < Math.abs(ratioWidth - next.width)) {
            next.height = ratioHeight;
          } else {
            next.width = ratioWidth;
          }
          next = clampMapping(next);
        }
      }

      const snapped = applySnapping(interaction.roomId, next, interaction.kind, interaction.corner);
      interaction.currentMapping = snapped.mapping;
      if (frameRequestRef.current != null) return;
      frameRequestRef.current = window.requestAnimationFrame(() => {
        frameRequestRef.current = null;
        setMappingOverrides((current) => ({ ...current, [interaction.roomId]: interaction.currentMapping }));
        setAlignmentGuides(snapped.guides);
        setCollisionRoomId(hasHeavyOverlap(interaction.roomId, interaction.currentMapping) ? interaction.roomId : null);
      });
    }

    function finishInteraction() {
      const interaction = interactionRef.current;
      const furnitureInteraction = furnitureInteractionRef.current;
      if (furnitureInteraction) {
        furnitureInteractionRef.current = null;
        persistFurniture(furnitureInteraction.roomId, furnitureInteraction.currentFurniture);
        return;
      }
      if (!interaction) return;
      interactionRef.current = null;
      setAlignmentGuides([]);
      setCollisionRoomId(null);
      persistRoomMapping(interaction.roomId, interaction.currentMapping);
    }

    window.addEventListener('pointermove', updateInteraction);
    window.addEventListener('pointerup', finishInteraction);
    window.addEventListener('pointercancel', finishInteraction);
    return () => {
      window.removeEventListener('pointermove', updateInteraction);
      window.removeEventListener('pointerup', finishInteraction);
      window.removeEventListener('pointercancel', finishInteraction);
      if (frameRequestRef.current != null) {
        window.cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [persistFurniture, persistRoomMapping, pointFromClient]);

  useEffect(() => {
    if (!selectedRoom || !hasMapping(selectedRoom)) {
      setLayoutScore(null);
      return;
    }
    setScoreLoading(true);
    const timeout = window.setTimeout(() => {
      api.roomLayoutScore(token, projectId, selectedRoom.id)
        .then(setLayoutScore)
        .catch(() => setLayoutScore(null))
        .finally(() => setScoreLoading(false));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [projectId, selectedRoom, selectedRoom?.furniture, furnitureOverrides, token]);

  async function addFurniture(room: Room, type: string) {
    setError('');
    setStatus('');
    try {
      await api.addFurniture(token, projectId, room.id, {
        type,
        xPercent: 8,
        yPercent: 8,
        widthPercent: type === 'Bed' || type === 'Sofa' ? 28 : 18,
        heightPercent: type === 'Wardrobe' || type === 'TV unit' ? 24 : 20,
        rotationAngle: 0
      });
      setStatus(`${type} added to ${room.name}.`);
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add furniture');
    }
  }

  async function autoArrangeFurniture(room: Room) {
    setError('');
    setStatus('');
    setArranging(true);
    try {
      await api.autoArrangeFurniture(token, projectId, room.id);
      setSelectedFurnitureId(null);
      setFurnitureOverrides({});
      setStatus('Furniture auto-arranged for this room.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not auto arrange furniture');
    } finally {
      setArranging(false);
    }
  }

  function startFurnitureInteraction(event: React.PointerEvent<HTMLElement>, room: Room, furniture: FurnitureItem, kind: 'move' | 'resize' | 'rotate', corner?: ResizeCorner) {
    event.preventDefault();
    event.stopPropagation();
    const roomRect = (event.currentTarget.closest('.mapped-room') as HTMLElement | null)?.getBoundingClientRect();
    if (!roomRect) return;
    const startPoint = {
      x: ((event.clientX - roomRect.left) / roomRect.width) * 100,
      y: ((event.clientY - roomRect.top) / roomRect.height) * 100
    };
    setSelectedRoomId(room.id);
    setSelectedFurnitureId(furniture.id);
    furnitureInteractionRef.current = {
      roomId: room.id,
      furnitureId: furniture.id,
      kind,
      corner,
      roomRect: {
        left: roomRect.left,
        top: roomRect.top,
        width: roomRect.width,
        height: roomRect.height
      },
      startPoint,
      startFurniture: furnitureWithDefaults(furniture),
      currentFurniture: furnitureWithDefaults(furniture)
    };
  }

  async function deleteSelectedFurniture() {
    if (!selectedRoomId || !selectedFurnitureId) return;
    setError('');
    try {
      await api.deleteFurniture(token, projectId, selectedRoomId, selectedFurnitureId);
      setSelectedFurnitureId(null);
      setFurnitureOverrides((current) => {
        const next = { ...current };
        delete next[selectedFurnitureId];
        return next;
      });
      setStatus('Furniture removed.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete furniture');
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedFurniture();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function startRoomInteraction(event: React.PointerEvent<HTMLElement>, room: Room, kind: 'move' | 'resize', corner?: ResizeCorner) {
    event.preventDefault();
    event.stopPropagation();
    const startMapping = getRoomMapping(room);
    const startPoint = pointFromEvent(event);
    setSelectedRoomId(room.id);
    setMode('map');
    setDraft(null);
    setStatus('');
    interactionRef.current = {
      roomId: room.id,
      kind,
      corner,
      startPoint,
      startMapping,
      currentMapping: startMapping,
      aspectRatio: startMapping.width / Math.max(startMapping.height, 1)
    };
  }

  async function saveMapping() {
    if (!selectedRoom || !shownDraft) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await api.updateRoom(token, projectId, selectedRoom.id, {
        name: selectedRoom.name,
        type: selectedRoom.type,
        length: selectedRoom.length,
        width: selectedRoom.width,
        mapX: Number(shownDraft.x.toFixed(2)),
        mapY: Number(shownDraft.y.toFixed(2)),
        mapWidth: Number(shownDraft.width.toFixed(2)),
        mapHeight: Number(shownDraft.height.toFixed(2))
      });
      setDraft(null);
      setStatus('Room mapping saved. Next step: review the 2D layout preview.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save room mapping');
    } finally {
      setSaving(false);
    }
  }

  async function saveTracedRoom() {
    if (!shownDraft) return;
    setError('');
    setStatus('');
    if (!traceName.trim()) {
      setError('Room name is required for traced rooms');
      return;
    }
    if (traceLength <= 0 || traceWidth <= 0) {
      setError('Length and width must be greater than zero');
      return;
    }
    setSaving(true);
    try {
      await api.addRoom(token, projectId, {
        name: traceName.trim(),
        type: traceType,
        length: traceLength,
        width: traceWidth,
        mapX: Number(shownDraft.x.toFixed(2)),
        mapY: Number(shownDraft.y.toFixed(2)),
        mapWidth: Number(shownDraft.width.toFixed(2)),
        mapHeight: Number(shownDraft.height.toFixed(2))
      });
      setDraft(null);
      setTraceName('');
      setTraceLength(12);
      setTraceWidth(10);
      setStatus('Traced room created. Next step: save preferences or review the 2D layout.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create traced room');
    } finally {
      setSaving(false);
    }
  }

  async function autoDetectRooms() {
    setError('');
    setStatus('');
    setDetecting(true);
    try {
      const detectedRooms = await api.detectBlueprintRooms(token, projectId);
      setStatus(detectedRooms.length > rooms.length
        ? 'Detected rooms were added to the blueprint. Select and refine them on the canvas.'
        : 'No room rectangles were detected. Try tracing rooms manually.');
      onMapped();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not auto detect rooms');
    } finally {
      setDetecting(false);
    }
  }

  return (
    <section className="panel section-card mapper-card">
      {!blueprint && <div className="empty-state">Upload a blueprint before mapping rooms.</div>}
      {blueprint && !isImage && <div className="empty-state">Trace Rooms From Blueprint is available for PNG and JPG blueprints only. PDF files can still use automatic layout.</div>}
      {blueprintUrl && (
        <>
          <div className="mode-tabs">
            <button type="button" className={mode === 'trace' ? 'active' : ''} onClick={() => {
              setMode('trace');
              setDraft(null);
              setStatus('');
            }}>Trace new room</button>
            <button type="button" className={mode === 'map' ? 'active' : ''} onClick={() => {
              setMode('map');
              setDraft(null);
              setStatus('');
            }}>Map existing room</button>
          </div>
          <div className="auto-detect-bar">
            <button type="button" className="primary" onClick={autoDetectRooms} disabled={detecting || !blueprint || !isImage}>
              {detecting ? 'Detecting rooms...' : 'Auto Detect Rooms'}
            </button>
            <span>Creates editable detected room rectangles from the uploaded blueprint image.</span>
          </div>
          <div className="mapper-toolbar">
            {mode === 'map' ? (
              <>
                <label>Room
                  <select value={selectedRoomId ?? ''} onChange={(event) => {
                    setSelectedRoomId(Number(event.target.value));
                    setDraft(null);
                    setStatus('');
                  }} disabled={rooms.length === 0}>
                    {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
                  </select>
                </label>
                <button type="button" onClick={saveMapping} disabled={!shownDraft || !selectedRoom || saving}>{saving ? 'Saving...' : 'Save mapping'}</button>
              </>
            ) : (
              <div className="trace-hint">Click and drag over the blueprint to trace a new room.</div>
            )}
          </div>
          {selectedRoom && hasMapping(selectedRoom) && (
            <div className="furniture-panel">
              <div>
                <strong>Add Furniture</strong>
                <span>{selectedRoom.name}</span>
              </div>
              <div className="furniture-options">
                {furnitureOptions.map((item) => (
                  <button type="button" key={item} onClick={() => addFurniture(selectedRoom, item)}>{item}</button>
                ))}
                <button type="button" className="primary" onClick={() => autoArrangeFurniture(selectedRoom)} disabled={arranging}>
                  {arranging ? 'Arranging...' : 'Auto Arrange'}
                </button>
              </div>
            </div>
          )}
          {selectedRoom && hasMapping(selectedRoom) && (
            <div className="layout-score-card">
              <div>
                <span>Room Score</span>
                <strong>{scoreLoading ? '...' : layoutScore ? Math.round(layoutScore.overallScore) : '--'}</strong>
              </div>
              {layoutScore && (
                <>
                  <div className="score-breakdown">
                    <span>Space {Math.round(layoutScore.breakdown.space)}</span>
                    <span>Spacing {Math.round(layoutScore.breakdown.spacing)}</span>
                    <span>Align {Math.round(layoutScore.breakdown.alignment)}</span>
                    <span>Safety {Math.round(layoutScore.breakdown.safety)}</span>
                  </div>
                  <div className="live-suggestions">
                    {layoutScore.suggestions.slice(0, 4).map((suggestion) => (
                      <p key={suggestion.message} className={`live-suggestion ${suggestion.type}`}>{suggestion.message}</p>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {mode === 'map' && rooms.length === 0 && <div className="empty-state">No existing rooms yet. Use Trace new room to create rooms directly from the blueprint.</div>}
          <div className="mapper-surface" ref={surfaceRef}>
            <div
              className="blueprint-image-frame"
              ref={frameRef}
              style={{ left: imageFrame.left, top: imageFrame.top, width: imageFrame.width, height: imageFrame.height }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                const point = pointFromEvent(event);
                setDragStart(point);
                setDraft({ x: point.x, y: point.y, width: 0, height: 0 });
              }}
              onPointerMove={(event) => {
                if (!dragStart) return;
                const point = pointFromEvent(event);
                setDraft({
                  x: Math.min(dragStart.x, point.x),
                  y: Math.min(dragStart.y, point.y),
                  width: Math.abs(point.x - dragStart.x),
                  height: Math.abs(point.y - dragStart.y)
                });
              }}
              onPointerUp={(event) => {
                event.currentTarget.releasePointerCapture(event.pointerId);
                setDragStart(null);
              }}
              onPointerCancel={() => setDragStart(null)}
            >
              <img ref={imageRef} src={blueprintUrl} alt={blueprint?.originalFileName ?? 'Blueprint'} onLoad={updateImageFrame} />
              {alignmentGuides.map((guide, index) => (
                <span
                  key={`${guide.orientation}-${guide.position}-${index}`}
                  className={`alignment-guide ${guide.orientation}`}
                  style={guide.orientation === 'vertical' ? { left: `${guide.position}%` } : { top: `${guide.position}%` }}
                />
              ))}
              {mappedRooms.map((room) => {
                const mapping = getRoomMapping(room);
                const selected = selectedRoomId === room.id;
                return (
                  <div
                    key={room.id}
                    className={[
                      'mapped-room',
                      selected ? 'selected' : '',
                      collisionRoomId === room.id ? 'collision-warning' : ''
                    ].filter(Boolean).join(' ')}
                    style={{ left: `${mapping.x}%`, top: `${mapping.y}%`, width: `${mapping.width}%`, height: `${mapping.height}%` }}
                    onPointerDown={(event) => startRoomInteraction(event, room, 'move')}
                  >
                    <span className="room-label">{room.name}</span>
                    {furnitureForRoom(room).map((item) => (
                      <span
                        key={item.id}
                        className={[
                          'furniture-item',
                          `furniture-${furnitureClass(item.type)}`,
                          selectedFurnitureId === item.id ? 'selected' : '',
                          issueTypeByFurnitureId.get(item.id) ? `issue-${issueTypeByFurnitureId.get(item.id)}` : ''
                        ].filter(Boolean).join(' ')}
                        style={{
                          left: `${item.xPercent}%`,
                          top: `${item.yPercent}%`,
                          width: `${item.widthPercent}%`,
                          height: `${item.heightPercent}%`,
                          transform: `rotate(${item.rotationAngle ?? 0}deg)`
                        }}
                        onPointerDown={(event) => startFurnitureInteraction(event, room, item, 'move')}
                      >
                        <span className="furniture-label">{item.type}</span>
                        {selectedFurnitureId === item.id && (
                          <>
                            <button type="button" className="furniture-delete" onPointerDown={(event) => event.stopPropagation()} onClick={deleteSelectedFurniture}>Delete</button>
                            <span className="furniture-rotate-handle" onPointerDown={(event) => startFurnitureInteraction(event, room, item, 'rotate')} />
                            <span className="furniture-resize-handle top-left" onPointerDown={(event) => startFurnitureInteraction(event, room, item, 'resize', 'top-left')} />
                            <span className="furniture-resize-handle top-right" onPointerDown={(event) => startFurnitureInteraction(event, room, item, 'resize', 'top-right')} />
                            <span className="furniture-resize-handle bottom-left" onPointerDown={(event) => startFurnitureInteraction(event, room, item, 'resize', 'bottom-left')} />
                            <span className="furniture-resize-handle bottom-right" onPointerDown={(event) => startFurnitureInteraction(event, room, item, 'resize', 'bottom-right')} />
                          </>
                        )}
                      </span>
                    ))}
                    {selected && (
                      <>
                        <span className="resize-handle top-left" onPointerDown={(event) => startRoomInteraction(event, room, 'resize', 'top-left')} />
                        <span className="resize-handle top-right" onPointerDown={(event) => startRoomInteraction(event, room, 'resize', 'top-right')} />
                        <span className="resize-handle bottom-left" onPointerDown={(event) => startRoomInteraction(event, room, 'resize', 'bottom-left')} />
                        <span className="resize-handle bottom-right" onPointerDown={(event) => startRoomInteraction(event, room, 'resize', 'bottom-right')} />
                      </>
                    )}
                  </div>
                );
              })}
              {shownDraft && (
                <div
                  className="mapped-room active"
                  style={{ left: `${shownDraft.x}%`, top: `${shownDraft.y}%`, width: `${shownDraft.width}%`, height: `${shownDraft.height}%` }}
                >
                  {mode === 'trace' ? 'New room' : selectedRoom?.name}
                </div>
              )}
              </div>
          </div>
          {mode === 'trace' && shownDraft && (
            <form className="trace-form" onSubmit={(event) => {
              event.preventDefault();
              saveTracedRoom();
            }}>
              <h3>Trace Rooms From Blueprint</h3>
              <div className="split">
                <label>Room name<input value={traceName} onChange={(event) => setTraceName(event.target.value)} required /></label>
                <label>Room type
                  <select value={traceType} onChange={(event) => setTraceType(event.target.value)}>
                    <option>Bedroom</option>
                    <option>Living room</option>
                    <option>Kitchen</option>
                    <option>Bathroom</option>
                    <option>Dining room</option>
                  </select>
                </label>
              </div>
              <div className="split">
                <label>Length<input type="number" min="0.1" step="0.1" value={traceLength} onChange={(event) => setTraceLength(Number(event.target.value))} /></label>
                <label>Width<input type="number" min="0.1" step="0.1" value={traceWidth} onChange={(event) => setTraceWidth(Number(event.target.value))} /></label>
              </div>
              <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create traced room'}</button>
            </form>
          )}
        </>
      )}
      {status && <div className="success-state">{status}</div>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
