/**
 * Optimize Excalidraw arrow coordinates
 * Strategy: Shape-Aware Orthogonal Projection.
 * 1. Calculate ideal orthogonal points based on bounding box overlaps.
 * 2. Ray-cast/Project these points onto the ACTUAL shape boundaries (Diamond/Ellipse).
 */

/**
 * Helper: Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * Get the bounding box and geometry info of an element
 */
function getElementGeometry(element) {
  const x = element.x || 0;
  const y = element.y || 0;
  const w = element.width || 100;
  const h = element.height || 100;
  
  return {
    type: element.type || 'rectangle', // rectangle, diamond, ellipse
    x, y, w, h,
    left: x,
    right: x + w,
    top: y,
    bottom: y + h,
    centerX: x + w / 2,
    centerY: y + h / 2,
    halfW: w / 2,
    halfH: h / 2
  };
}

/**
 * Adjust a point on the bounding box to lie on the actual shape geometry.
 * Preserves the orthogonality (e.g., if on Top edge, keep X, change Y).
 */
function projectPointToShape(geom, x, y, edge) {
  // If it's a rectangle, the bounding box point is already correct.
  if (geom.type !== 'diamond' && geom.type !== 'ellipse') {
    return { x, y };
  }

  const { centerX, centerY, halfW, halfH } = geom;

  // Diamond (Rhombus) Intersection
  // Equation: |x-cx|/hw + |y-cy|/hh = 1
  if (geom.type === 'diamond') {
    if (edge === 'top') {
      // Keep X, calculate Y (Top hemisphere: y < centerY)
      const deltaX = Math.abs(x - centerX);
      const newY = centerY - halfH * (1 - deltaX / halfW);
      return { x, y: newY };
    } 
    else if (edge === 'bottom') {
      // Keep X, calculate Y (Bottom hemisphere: y > centerY)
      const deltaX = Math.abs(x - centerX);
      const newY = centerY + halfH * (1 - deltaX / halfW);
      return { x, y: newY };
    } 
    else if (edge === 'left') {
      // Keep Y, calculate X (Left hemisphere: x < centerX)
      const deltaY = Math.abs(y - centerY);
      const newX = centerX - halfW * (1 - deltaY / halfH);
      return { x: newX, y };
    } 
    else if (edge === 'right') {
      // Keep Y, calculate X (Right hemisphere: x > centerX)
      const deltaY = Math.abs(y - centerY);
      const newX = centerX + halfW * (1 - deltaY / halfH);
      return { x: newX, y };
    }
  }

  // Ellipse Intersection
  // Equation: ((x-cx)/hw)^2 + ((y-cy)/hh)^2 = 1
  if (geom.type === 'ellipse') {
    if (edge === 'top' || edge === 'bottom') {
      // Keep X, Find Y
      // (y-cy)^2 = hh^2 * (1 - ((x-cx)/hw)^2)
      const normX = (x - centerX) / halfW;
      // Safety clamp for sqrt (floating point errors)
      const term = Math.max(0, 1 - normX * normX); 
      const deltaY = halfH * Math.sqrt(term);
      
      return { 
        x, 
        y: edge === 'top' ? centerY - deltaY : centerY + deltaY 
      };
    } 
    else if (edge === 'left' || edge === 'right') {
      // Keep Y, Find X
      const normY = (y - centerY) / halfH;
      const term = Math.max(0, 1 - normY * normY);
      const deltaX = halfW * Math.sqrt(term);

      return { 
        x: edge === 'left' ? centerX - deltaX : centerX + deltaX,
        y 
      };
    }
  }

  // Fallback
  return { x, y };
}

/**
 * Calculate the overlap range between two intervals
 */
function getOverlapCenter(min1, max1, min2, max2) {
  const start = Math.max(min1, min2);
  const end = Math.min(max1, max2);
  return start < end ? (start + end) / 2 : null;
}

/**
 * Calculate the best point on a specific edge, 
 * then CORRECT it for non-rectangular shapes.
 */
function getPointOnEdge(geom, edgeType, targetGeom, fixedValue = null) {
  // 1. Determine Bounding Box Point
  let boxX, boxY;
  
  // Padding creates a visual offset from the absolute corner, helpful for diamonds
  // But strictly, we should project first, then maybe buffer. 
  // For shape correction, let's keep padding small or rely on the clamp.
  const paddingX = geom.w * 0.1; 
  const paddingY = geom.h * 0.1;

  switch (edgeType) {
    case 'top':
      boxX = fixedValue !== null ? fixedValue : clamp(targetGeom.centerX, geom.left + paddingX, geom.right - paddingX);
      boxY = geom.top;
      break;
    case 'bottom':
      boxX = fixedValue !== null ? fixedValue : clamp(targetGeom.centerX, geom.left + paddingX, geom.right - paddingX);
      boxY = geom.bottom;
      break;
    case 'left':
      boxX = geom.left;
      boxY = fixedValue !== null ? fixedValue : clamp(targetGeom.centerY, geom.top + paddingY, geom.bottom - paddingY);
      break;
    case 'right':
      boxX = geom.right;
      boxY = fixedValue !== null ? fixedValue : clamp(targetGeom.centerY, geom.top + paddingY, geom.bottom - paddingY);
      break;
    default:
      boxX = geom.left; boxY = geom.top;
  }

  // 2. Correct Point for Shape (Diamond/Ellipse)
  return projectPointToShape(geom, boxX, boxY, edgeType);
}

/**
 * Calculate Euclidean distance
 */
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Main logic to find start/end points
 */
function getBestConnectionPoints(startEle, endEle) {
  const b1 = getElementGeometry(startEle);
  const b2 = getElementGeometry(endEle);
  
  // Check Overlaps
  const overlapX = getOverlapCenter(b1.left, b1.right, b2.left, b2.right);
  const overlapY = getOverlapCenter(b1.top, b1.bottom, b2.top, b2.bottom);

  // Strategy A: Vertical Alignment (Stacked)
  if (overlapX !== null) {
    if (b1.centerY < b2.centerY) {
      return {
        start: getPointOnEdge(b1, 'bottom', b2, overlapX),
        end: getPointOnEdge(b2, 'top', b1, overlapX)
      };
    } else {
      return {
        start: getPointOnEdge(b1, 'top', b2, overlapX),
        end: getPointOnEdge(b2, 'bottom', b1, overlapX)
      };
    }
  }

  // Strategy B: Horizontal Alignment (Side by side)
  if (overlapY !== null) {
    if (b1.centerX < b2.centerX) {
      return {
        start: getPointOnEdge(b1, 'right', b2, overlapY),
        end: getPointOnEdge(b2, 'left', b1, overlapY)
      };
    } else {
      return {
        start: getPointOnEdge(b1, 'left', b2, overlapY),
        end: getPointOnEdge(b2, 'right', b1, overlapY)
      };
    }
  }

  // Strategy C: Diagonal / No Overlap
  const edges = ['top', 'bottom', 'left', 'right'];
  let minDistance = Infinity;
  let bestStart = { x: 0, y: 0 };
  let bestEnd = { x: 0, y: 0 };

  for (const startEdge of edges) {
    for (const endEdge of edges) {
      const p1 = getPointOnEdge(b1, startEdge, b2, null);
      const p2 = getPointOnEdge(b2, endEdge, b1, null);
      
      const dist = getDistance(p1, p2);

      if (dist < minDistance) {
        minDistance = dist;
        bestStart = p1;
        bestEnd = p2;
      }
    }
  }

  return { start: bestStart, end: bestEnd };
}

/**
 * Exporter
 */
export function optimizeExcalidrawCode(codeString) {
  if (!codeString || typeof codeString !== 'string') return codeString;

  try {
    const cleanedCode = codeString.trim();
    const arrayMatch = cleanedCode.match(/\[[\s\S]*\]/);
    if (!arrayMatch) return codeString;

    const elements = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(elements)) return codeString;

    const elementMap = new Map();
    elements.forEach(el => {
      if (el.id) elementMap.set(el.id, el);
    });

    const optimizedElements = elements.map(element => {
      if (element.type !== 'arrow' && element.type !== 'line') return element;

      // const startEle = element.start && element.start.id ? elementMap.get(element.start.id) : null;
      // const endEle = element.end && element.end.id ? elementMap.get(element.end.id) : null;

      // if (startEle && endEle) {
      //   const optimized = { ...element };
      //   const { start, end } = getBestConnectionPoints(startEle, endEle);

      //   optimized.x = start.x;
      //   optimized.y = start.y;

      //   const dx = end.x - start.x;
      //   const dy = end.y - start.y;

      //   optimized.points = [[0, 0], [dx, dy]];
      //   optimized.width = Math.abs(dx);
      //   optimized.height = Math.abs(dy);
        
        
      //   return optimized;
      // }
      if (element.width === 0) element.width = 1;
      if (element.height === 0) element.height = 1;
      return element;
    });

    return JSON.stringify(optimizedElements, null, 2);
  } catch (error) {
    console.error('Failed to optimize arrows:', error);
    return codeString;
  }
}