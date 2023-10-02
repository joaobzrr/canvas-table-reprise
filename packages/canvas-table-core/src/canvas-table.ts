import { LineRenderer } from "./LineRenderer";
import { TextRenderer } from "./TextRenderer";
import { defaultTheme } from "./defaultTheme";
import {
  shallowMerge,
  scale,
  clamp,
  createRect,
  createVector,
  createSize,
  fillRect,
  clearRect,
  clipRect,
  pointInRect
} from "./utils";
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_THUMB_LENGTH,
  COLUMN_RESIZER_WIDTH,
  BORDER_WIDTH,
} from "./constants";
import {
  CanvasTable,
  CanvasTableParams,
  ColumnDef,
  ColumnState,
  DataRow,
  VectorLike,
  Size,
  Theme,
} from "./types";

export function canvasTableCreate(params: CanvasTableParams): CanvasTable {
  const { container, columnDefs, dataRows, size } = params;

  const columnStates = columnDefsToColumnStates(columnDefs);

  const theme = { ...defaultTheme, ...params.theme };

  const canvasSize = createSize(size);

  const containerEl = document.getElementById(container);
  if (!containerEl) {
    throw new Error(`Element with id "${params.container}" could not be found`);
  }

  containerEl.replaceChildren();
  containerEl.style.overflow = "hidden";

  const wrapperEl = document.createElement("div");
  wrapperEl.classList.add("canvas-table-wrapper");
  containerEl.appendChild(wrapperEl);

  const canvas = document.createElement("canvas");
  canvas.width  = canvasSize.width;
  canvas.height = canvasSize.height;
  wrapperEl.appendChild(canvas);

  const lineRenderer = new LineRenderer();
  const textRenderer = new TextRenderer();

  const mousePos = createVector();

  const { rowHeight } = theme;

  const bodyRect   = createRect({ y: rowHeight });
  const headerRect = createRect({ height: rowHeight });

  const mainRect = createRect();

  const scrollPos = createVector();
  const maxScrollPos = createVector();
  const normalizedScrollPos = createVector();

  const scrollSize = createSize();
  const viewportSize = createSize();
  const normalizedViewportSize = createSize();

  const hsbTrackRect = createRect();
  const hsbThumbRect = createRect();
  const hsbMaxThumbPos = 0;
  const hsbDragOffset = 0;
  const hsbIsDragging = false;

  const vsbTrackRect = createRect();
  const vsbThumbRect = createRect();
  const vsbMaxThumbPos = 0;
  const vsbDragOffset = 0;
  const vsbIsDragging = false;

  const indexOfColumnWhoseResizerIsBeingHovered = -1;
  const indexOfColumnBeingResized = -1;

  const overflowX = false;
  const overflowY = false;

  const firstVisibleColumnPos = 0;

  const ct = {
    canvas,
    containerEl,
    wrapperEl,
    lineRenderer,
    textRenderer,
    mousePos,
    columnStates,
    dataRows,
    theme,
    mainRect,
    bodyRect,
    headerRect,
    hsbTrackRect,
    hsbThumbRect,
    hsbMaxThumbPos,
    hsbDragOffset,
    hsbIsDragging,
    vsbTrackRect,
    vsbThumbRect,
    vsbMaxThumbPos,
    vsbDragOffset,
    vsbIsDragging,
    indexOfColumnWhoseResizerIsBeingHovered,
    indexOfColumnBeingResized,
    firstVisibleColumnPos,
    scrollPos,
    maxScrollPos,
    normalizedScrollPos,
    scrollSize,
    viewportSize,
    normalizedViewportSize,
    overflowX,
    overflowY
  } as CanvasTable;

  updateScrollbarGeometry(ct);
  updateContentSize(ct);
  updateFirstVisibleColumnIndexAndPosition(ct);
  updateTableRanges(ct);
  updateGridSize(ct);
  updateGridPositions(ct);

  updateFonts(ct);

  ct.mouseDownHandler = (e) => onMouseDown(ct, e);
  ct.mouseUpHandler   = (e) => onMouseUp(ct, e);
  ct.mouseMoveHandler = (e) => onMouseMove(ct, e);
  ct.wheelHandler     = (e) => onWheel(ct, e);

  canvas.addEventListener("mousedown", ct.mouseDownHandler);
  canvas.addEventListener("wheel", ct.wheelHandler);

  document.addEventListener("mousemove", ct.mouseMoveHandler);
  document.addEventListener("mouseup", ct.mouseUpHandler);

  return ct;
}

export function canvasTableSetContent(
  ct: CanvasTable,
  columnDefs: ColumnDef[],
  dataRows: DataRow[]
) {
  const columnStates = columnDefsToColumnStates(columnDefs);
  ct.columnStates = columnStates;

  ct.dataRows = dataRows;

  updateContentSize(ct);
  reflow(ct);
  updateFirstVisibleColumnIndexAndPosition(ct);
  updateTableRanges(ct);
  updateGridSize(ct);
  updateGridPositions(ct);

  render(ct);
}

export function canvasTableSetSize(ct: CanvasTable, size: Size) {
  if (size.width <= 0 || size.height <= 0) {
    return;
  }

  const { canvas } = ct;

  canvas.width  = size.width;
  canvas.height = size.height;

  reflow(ct);
  updateFirstVisibleColumnIndexAndPosition(ct);
  updateTableRanges(ct);
  updateGridSize(ct);
  updateGridPositions(ct);

  render(ct);
}

export function canvasTableSetTheme(ct: CanvasTable, theme: Partial<Theme>) {
  const _theme = shallowMerge<Theme>({}, defaultTheme, theme);
  ct.theme = _theme;

  updateContentSize(ct);
  reflow(ct);
  updateFirstVisibleColumnIndexAndPosition(ct);
  updateTableRanges(ct);
  updateGridSize(ct);
  updateGridPositions(ct);

  updateFonts(ct);

  const { lineRenderer } = ct;
  const { tableBorderColor } = _theme;

  lineRenderer.setColor(tableBorderColor);

  render(ct);
}

export function canvasTableCleanup(ct: CanvasTable) {
  const { mouseMoveHandler, mouseUpHandler } = ct;

  document.removeEventListener("mousemove", mouseMoveHandler);
  document.removeEventListener("mouseup", mouseUpHandler);
}

function onMouseDown(ct: CanvasTable, event: MouseEvent) {
  const { wrapperEl, hsbThumbRect, vsbThumbRect } = ct;

  const eventPos = { x: event.clientX, y: event.clientY };

  const mousePos = getRelativeMousePos(wrapperEl, eventPos);
  const { x: mouseX, y: mouseY } = mousePos;

  const { x: hsbThumbX } = hsbThumbRect;

  const hsbIsDragging = pointInRect(mousePos, hsbThumbRect);
  if (hsbIsDragging) {
    ct.hsbDragOffset = mouseX - hsbThumbX;
  }
  ct.hsbIsDragging = hsbIsDragging;

  const { y: vsbThumbY } = vsbThumbRect;

  const vsbIsDragging = pointInRect(mousePos, vsbThumbRect);
  if (vsbIsDragging) {
    ct.vsbDragOffset = mouseY - vsbThumbY;
  }
  ct.vsbIsDragging = vsbIsDragging;

  const { indexOfColumnWhoseResizerIsBeingHovered } = ct;
  if (indexOfColumnWhoseResizerIsBeingHovered !== -1) {
    ct.indexOfColumnBeingResized = indexOfColumnWhoseResizerIsBeingHovered;
  }
}

function onMouseUp(ct: CanvasTable, _event: MouseEvent) {
  let shouldUpdate = false;

  ct.hsbIsDragging = false;
  ct.vsbIsDragging = false;

  {
    const { indexOfColumnBeingResized: oldIndex } = ct;
    const newIndex = -1;
    if (newIndex !== oldIndex) {
      ct.indexOfColumnBeingResized = newIndex;
      shouldUpdate = true;
    }
  }

  if (shouldUpdate) {
    render(ct);
  }
}

function onMouseMove(ct: CanvasTable, event: MouseEvent) {
  const { wrapperEl }  = ct;

  const eventPos = { x: event.clientX, y: event.clientY }

  const mousePos = getRelativeMousePos(wrapperEl, eventPos);
  const { x: mouseX, y: mouseY } = mousePos;

  let shouldUpdate = false;

  const {
    scrollPos,
    maxScrollPos,
    normalizedScrollPos,
    hsbTrackRect,
    hsbThumbRect,
    hsbMaxThumbPos,
    hsbDragOffset,
    hsbIsDragging
  } = ct;

  const { x: maxScrollLeft } = maxScrollPos;
  const { x: hsbTrackX } = hsbTrackRect;

  if (hsbIsDragging) {
    const hsbThumbX = clamp(mouseX - hsbDragOffset, hsbTrackX, hsbMaxThumbPos);
    hsbThumbRect.x = hsbThumbX;

    const normScrollLeft = scale(hsbThumbX, hsbTrackX, hsbMaxThumbPos, 0, 1);
    normalizedScrollPos.x = normScrollLeft;

    const scrollLeft = Math.round(scale(normScrollLeft, 0, 1, 0, maxScrollLeft));
    scrollPos.x = scrollLeft;

    shouldUpdate = true;
  }

  const {
    vsbTrackRect,
    vsbThumbRect,
    vsbMaxThumbPos,
    vsbDragOffset,
    vsbIsDragging
  } = ct;

  const { y: maxScrollTop } = maxScrollPos;
  const { y: vsbTrackY } = vsbTrackRect;

  if (vsbIsDragging) {
    const vsbThumbY = clamp(mouseY - vsbDragOffset, vsbTrackY, vsbMaxThumbPos);
    vsbThumbRect.y = vsbThumbY;

    const normScrollTop = scale(vsbThumbY, vsbTrackY, vsbMaxThumbPos, 0, 1);
    normalizedScrollPos.y = normScrollTop;

    const scrollTop = Math.round(scale(normScrollTop, 0, 1, 0, maxScrollTop));
    scrollPos.y = scrollTop;

    shouldUpdate = true;
  }

  {
    const { indexOfColumnWhoseResizerIsBeingHovered: oldIndex } = ct;

    const newIndex = findIndexOfColumnWhoseResizerIsBeingHovered(ct, mousePos);
    if (newIndex !== oldIndex) {
      ct.indexOfColumnWhoseResizerIsBeingHovered = newIndex;
      shouldUpdate = true;
    }
  }

  // const { columnStates, columnPositions, indexOfColumnBeingResized, tableRanges } = ct;
  // const { columnLeft } = tableRanges;

  // if (indexOfColumnBeingResized) {
  //   const columnState = columnStates[indexOfColumnBeingResized];
  //   const { width: columnWidth } = columnState;

  //   const columnPositionIndex = indexOfColumnBeingResized - columnLeft;
  //   const columnPosition = columnPositions[columnPositionIndex];

  //   const x = columnPosition + columnWidth;
  // }

  if (shouldUpdate) {
    updateFirstVisibleColumnIndexAndPosition(ct);
    updateTableRanges(ct);
    updateGridPositions(ct);
    render(ct);
  }
}

function onWheel(_ct: CanvasTable, _event: WheelEvent) {
}

function render(ct: CanvasTable) {
  const { canvas } = ct;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not instantiate context");
  }

  const { theme } = ct;

  // Draw or clear table background
  const { tableBackgroundColor } = theme;
  const canvasRect = createRect(0, 0, canvas.width, canvas.height);
  if (tableBackgroundColor) {
    ctx.fillStyle = tableBackgroundColor;
    fillRect(ctx, canvasRect);
  } else {
    clearRect(ctx, canvasRect);
  }

  // Draw body background
  const { bodyRect } = ct;
  const { bodyBackgroundColor = tableBackgroundColor } = theme;
  if (bodyBackgroundColor) {
    ctx.fillStyle = bodyBackgroundColor;
    fillRect(ctx, bodyRect);
  }

  // Draw header background
  const { headerRect } = ct;
  const { headerBackgroundColor = tableBackgroundColor } = theme;
  if (headerBackgroundColor) {
    ctx.fillStyle = headerBackgroundColor;
    fillRect(ctx, headerRect);
  }

  const {
    hsbOuterRect,
    hsbThumbRect,
    vsbOuterRect,
    vsbThumbRect,
    overflowX,
    overflowY
  } = ct;

  // Draw scrollbar background and thumb
  const { scrollbarTrackColor, scrollbarThumbColor } = theme;
  if (overflowX) {
    if (scrollbarTrackColor) {
      ctx.fillStyle = scrollbarTrackColor;
      fillRect(ctx, hsbOuterRect)
    }

    ctx.fillStyle = scrollbarThumbColor;
    fillRect(ctx, hsbThumbRect);
  }

  if (overflowY) {
    if (scrollbarTrackColor) {
      ctx.fillStyle = scrollbarTrackColor;
      fillRect(ctx, vsbOuterRect)
    }
    
    ctx.fillStyle = scrollbarThumbColor;
    fillRect(ctx, vsbThumbRect);
  }

  const { lineRenderer } = ct;

  // Draw outer border
  lineRenderer.hline(ctx, 0, 0, canvas.width);
  lineRenderer.vline(ctx, 0, 0, canvas.height);
  lineRenderer.hline(ctx, 0, canvas.height - BORDER_WIDTH, canvas.width);
  lineRenderer.vline(ctx, canvas.width - BORDER_WIDTH, 0, canvas.height);

  const { rowHeight } = theme;

  // Draw header bottom border
  lineRenderer.hline(ctx, 0, rowHeight, canvas.width);

  const { gridSize } = ct;

  // If horizontal scrollbar is visible, draw its border, otherwise,
  // draw table content right border
  if (overflowX) {
    lineRenderer.hline(ctx, 0, hsbOuterRect.y, canvas.width);
  } else {
    lineRenderer.vline(ctx, gridSize.width, 0, gridSize.height);
  }

  // If vertical scrollbar is visible, draw its border, otherwise,
  // draw table content bottom border
  if (overflowY) {
    lineRenderer.vline(ctx, vsbOuterRect.x, 0, canvas.height);
  } else {
    lineRenderer.hline(ctx, 0, gridSize.height, gridSize.width);
  }

  const { columnPositions, rowPositions } = ct;

  // Draw grid horizontal lines
  for (let i = 1; i < rowPositions.length; i++) {
    const y = rowPositions[i];
    lineRenderer.hline(ctx, 0, y, gridSize.width);
  }

  // Draw grid vertical lines
  for (let i = 1; i < columnPositions.length; i++) {
    const x = columnPositions[i];
    lineRenderer.vline(ctx, x, 0, gridSize.height);
  }

  const { textRenderer, bodyFont } = ct;

  const { columnStates, dataRows, tableRanges } = ct;

  const { columnLeft, rowTop } = tableRanges;

  const { cellPadding } = theme;

  const halfOfRowHeight = rowHeight / 2;
  const doubleOfCellPadding = cellPadding * 2;

  // Calculate text data
  const bodyTextData = [];
  const headerTextData = [];
  for (const [j, xPos] of columnPositions.entries()) {
    const columnIndex = j + columnLeft;
    const columnState = columnStates[columnIndex];

    const x = xPos + cellPadding;
    const y = halfOfRowHeight;
    const maxWidth = columnState.width - doubleOfCellPadding;
    const text = columnState.title;

    headerTextData.push({ x, y, maxWidth, text })

    for (const [i, yPos] of rowPositions.entries()) {
      const rowIndex = i + rowTop;
      const dataRow = dataRows[rowIndex];

      const y = yPos + halfOfRowHeight;
      const text = dataRow[columnState.field];

      bodyTextData.push({ x, y, maxWidth, text });
    }
  }

  ctx.save();

  const { mainRect, headerFont } = ct;

  clipRect(ctx, mainRect);

  // Draw header font
  for (const { x, y, maxWidth, text } of headerTextData) {
    textRenderer.render(ctx, headerFont, text, x, y, maxWidth, true);
  }

  clipRect(ctx, bodyRect);

  // Draw body text
  for (const { x, y, maxWidth, text } of bodyTextData) {
    textRenderer.render(ctx, bodyFont, text, x, y, maxWidth, true);
  }

  ctx.restore();

  const {
    indexOfColumnWhoseResizerIsBeingHovered,
    indexOfColumnBeingResized,
  } = ct;

  const indexOfColumnToHighlight = indexOfColumnWhoseResizerIsBeingHovered !== -1
    ? indexOfColumnWhoseResizerIsBeingHovered
    : indexOfColumnBeingResized;

  if (indexOfColumnToHighlight !== -1) {
    const columnState = columnStates[indexOfColumnToHighlight];
    const { width: columnWidth } = columnState;

    const columnPositionIndex = indexOfColumnToHighlight - columnLeft;
    const columnPosition = columnPositions[columnPositionIndex];

    const x = columnPosition + columnWidth - COLUMN_RESIZER_WIDTH;
    const width = (COLUMN_RESIZER_WIDTH * 2) + 1;

    ctx.fillStyle = "blue";
    ctx.fillRect(x, 0, width, rowHeight);
  }
}

function reflow(ct: CanvasTable) {
  const {
    canvas,
    contentSize,
    mainRect,
    bodyRect,
    headerRect,
    scrollPos,
    theme
  } = ct;

  const { rowHeight, scrollbarThickness } = theme;

  const outerMainRectWidth  = canvas.width  - BORDER_WIDTH;
  const outerMainRectHeight = canvas.height - BORDER_WIDTH;
  const innerMainRectWidth  = outerMainRectWidth  - scrollbarThickness - BORDER_WIDTH;
  const innerMainRectHeight = outerMainRectHeight - scrollbarThickness - BORDER_WIDTH;

  const outerBodyRectHeight = outerMainRectHeight - rowHeight;
  const innerBodyRectHeight = innerMainRectHeight - rowHeight;

  let overflowX: boolean;
  let overflowY: boolean;
  if (outerMainRectWidth >= contentSize.width && outerBodyRectHeight >= contentSize.height) {
    overflowX = overflowY = false;
  } else {
    overflowX = innerMainRectWidth  < contentSize.width;
    overflowY = innerBodyRectHeight < contentSize.height;
  }

  ct.overflowX = overflowX;
  ct.overflowY = overflowY;

  if (overflowY) {
    mainRect.width = bodyRect.width = headerRect.width = innerMainRectWidth;
  } else {
    mainRect.width = bodyRect.width = headerRect.width = outerMainRectWidth;
  }

  if (overflowX) {
    mainRect.height = innerMainRectHeight;
    bodyRect.height = innerBodyRectHeight;
  } else {
    mainRect.height = outerMainRectHeight;
    bodyRect.height = outerBodyRectHeight;
  }

  const viewportSize = { width: bodyRect.width, height: bodyRect.height };
  ct.viewportSize = viewportSize;

  const scrollWidth  = Math.max(contentSize.width,  viewportSize.width);
  const scrollHeight = Math.max(contentSize.height, viewportSize.height);
  const scrollSize = { width: scrollWidth, height: scrollHeight };
  ct.scrollSize = scrollSize;

  const normalizedViewportWidth  = viewportSize.width  / scrollWidth;
  const normalizedViewportHeight = viewportSize.height / scrollHeight;
  const normalizedViewportSize = {
    width:  normalizedViewportWidth,
    height: normalizedViewportHeight
  };
  ct.normalizedViewportSize = normalizedViewportSize;

  const maxScrollLeft = scrollWidth  - viewportSize.width;
  const maxScrollTop  = scrollHeight - viewportSize.height;
  const maxScrollPos = { x: maxScrollLeft, y: maxScrollTop };
  ct.maxScrollPos = maxScrollPos;

  const scrollLeft = Math.round(clamp(scrollPos.x, 0, maxScrollLeft));
  const scrollTop  = Math.round(clamp(scrollPos.y, 0, maxScrollTop));
  ct.scrollPos = { x: scrollLeft, y: scrollTop };

  const normalizedScrollX = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
  const normalizedScrollY = maxScrollTop  > 0 ? scrollTop  / maxScrollTop  : 0;
  const normalizedScrollPos = {
    x: normalizedScrollX,
    y: normalizedScrollY
  };
  ct.normalizedScrollPos = normalizedScrollPos;

  updateScrollbarGeometry(ct);
  updateGridSize(ct);
}

function updateScrollbarGeometry(ct: CanvasTable) {
  const { mainRect, bodyRect, theme } = ct;
  const { rowHeight, scrollbarThickness, scrollbarTrackMargin } = theme;

  const outerThickness = scrollbarThickness + BORDER_WIDTH ;

  const hsbOuterRect = createRect({
    y: mainRect.height,
    width: mainRect.width,
    height: outerThickness
  });
  ct.hsbOuterRect = hsbOuterRect;

  const hsbInnerRect = createRect({
    x: BORDER_WIDTH,
    y: hsbOuterRect.y + BORDER_WIDTH,
    width: hsbOuterRect.width - BORDER_WIDTH,
    height: scrollbarThickness
  });
  ct.hsbInnerRect = hsbInnerRect;

  const hsbTrackX = hsbInnerRect.x + scrollbarTrackMargin;
  const hsbTrackY = hsbInnerRect.y + scrollbarTrackMargin;
  const hsbTrackWidth =  hsbInnerRect.width  - (scrollbarTrackMargin * 2);
  const hsbTrackHeight = hsbInnerRect.height - (scrollbarTrackMargin * 2);
  const hsbTrackRect = createRect({
    x: hsbTrackX,
    y: hsbTrackY,
    width: hsbTrackWidth,
    height: hsbTrackHeight
  });
  ct.hsbTrackRect = hsbTrackRect;

  const { normalizedViewportSize } = ct;
  const { width: normViewportWidth } = normalizedViewportSize;

  const hsbThumbWidth = Math.max(normViewportWidth * hsbTrackWidth, MIN_THUMB_LENGTH);

  const hsbMaxThumbPos = hsbTrackX + hsbTrackWidth - hsbThumbWidth;
  ct.hsbMaxThumbPos = hsbMaxThumbPos;

  const { scrollPos, maxScrollPos } = ct;
  const { x: scrollLeft } = scrollPos;
  const { x: maxScrollLeft } = maxScrollPos;

  ct.hsbThumbRect.x = scale(scrollLeft, 0, maxScrollLeft, hsbTrackX, hsbMaxThumbPos);
  ct.hsbThumbRect.y = hsbTrackY;
  ct.hsbThumbRect.width = hsbThumbWidth;
  ct.hsbThumbRect.height = hsbTrackHeight;

  ct.hsbMaxThumbPos = hsbMaxThumbPos;

  const vsbOuterRect = createRect({
    x: mainRect.width,
    y: rowHeight,
    width: outerThickness,
    height: bodyRect.height
  });
  ct.vsbOuterRect = vsbOuterRect;

  const vsbInnerRect = createRect({
    x: vsbOuterRect.x + BORDER_WIDTH,
    y: rowHeight + BORDER_WIDTH,
    width: scrollbarThickness,
    height: vsbOuterRect.height - BORDER_WIDTH
  });
  ct.vsbInnerRect = vsbInnerRect;

  const vsbTrackX = vsbInnerRect.x + scrollbarTrackMargin;
  const vsbTrackY = vsbInnerRect.y + scrollbarTrackMargin;
  const vsbTrackWidth =  vsbInnerRect.width  - (scrollbarTrackMargin * 2);
  const vsbTrackHeight = vsbInnerRect.height - (scrollbarTrackMargin * 2);
  const vsbTrackRect = createRect({
    x: vsbTrackX,
    y: vsbTrackY,
    width: vsbTrackWidth,
    height: vsbTrackHeight
  });
  ct.vsbTrackRect = vsbTrackRect;

  const { height: normViewportHeight } = normalizedViewportSize;

  const vsbThumbHeight = Math.max(normViewportHeight * vsbTrackHeight, MIN_THUMB_LENGTH);

  const vsbMaxThumbPos = vsbTrackY + vsbTrackHeight - vsbThumbHeight;
  ct.vsbMaxThumbPos = vsbMaxThumbPos;

  const { y: scrollTop } = scrollPos;
  const { y: maxScrollTop } = maxScrollPos;

  ct.vsbThumbRect.x = vsbTrackX;
  ct.vsbThumbRect.y = scale(scrollTop, 0, maxScrollTop, vsbTrackY, vsbMaxThumbPos);
  ct.vsbThumbRect.width = vsbTrackWidth;
  ct.vsbThumbRect.height = vsbThumbHeight;
}

function updateContentSize(ct: CanvasTable) {
  const { columnStates, dataRows, theme } = ct;
  const { rowHeight } = theme;

  const numberOfRows = dataRows.length;

  let contentWidth = 0;
  for (const columnState of columnStates) {
    const { width } = columnState;
    contentWidth += width;
  }

  const contentHeight = numberOfRows * rowHeight;
  const contentSize = createSize(contentWidth, contentHeight);

  ct.contentSize = contentSize;
}

function updateTableRanges(ct: CanvasTable) {
  const {
    columnStates,
    scrollPos,
    viewportSize,
    firstVisibleColumnIndex,
    firstVisibleColumnPos,
  } = ct;

  const { x: scrollLeft, y: scrollTop } = scrollPos;
  const { width: viewportWidth, height: viewportHeight } = viewportSize;

  const scrollRight  = scrollLeft + viewportWidth;
  const scrollBottom = scrollTop  + viewportHeight;

  const columnLeft = firstVisibleColumnIndex;

  let columnRight = columnLeft;
  let lastVisibleColumnPos = firstVisibleColumnPos;
  for (; columnRight < columnStates.length; columnRight++) {
    if (lastVisibleColumnPos >= scrollRight) {
      break;
    }
    const columnState = columnStates[columnRight];
    const { width: columnWidth } = columnState;
    lastVisibleColumnPos += columnWidth;
  }

  const { dataRows, theme } = ct;
  const { rowHeight } = theme;

  const rowTop = Math.floor(scrollTop / rowHeight);
  const rowBottom = Math.min(Math.ceil(scrollBottom / rowHeight), dataRows.length);

  const tableRanges = { columnLeft, columnRight, rowTop, rowBottom };
  ct.tableRanges = tableRanges;
}

function updateFirstVisibleColumnIndexAndPosition(ct: CanvasTable) {
  const { columnStates, scrollPos } = ct;
  const { x: scrollLeft } = scrollPos;

  let columnIndex = 0;
  let columnPos = 0;

  for (; columnIndex < columnStates.length - 1; columnIndex++) {
    const currColumnState = columnStates[columnIndex];
    const nextColumnState = columnStates[columnIndex + 1];
    const { width: nextColumnWidth } = nextColumnState;

    if (columnPos + nextColumnWidth > scrollLeft) {
      break;
    }

    const { width: currColumnWidth } = currColumnState;
    columnPos += currColumnWidth;
  }

  ct.firstVisibleColumnIndex = columnIndex;
  ct.firstVisibleColumnPos   = columnPos;
}

function updateGridSize(ct: CanvasTable) {
  const { mainRect, contentSize, theme } = ct;
  const { rowHeight } = theme;

  const { width: mainRectWidth, height: mainRectHeight } = mainRect;
  const { width: contentWidth, height: contentHeight } = contentSize;

  const gridWidth = Math.min(mainRectWidth, contentWidth);
  const gridHeight = Math.min(mainRectHeight, contentHeight + rowHeight);
  const gridSize = { width: gridWidth, height: gridHeight };

  ct.gridSize = gridSize;
}

function updateGridPositions(ct: CanvasTable) {
  const {
    columnStates,
    scrollPos,
    firstVisibleColumnPos,
    tableRanges,
    theme
  } = ct;

  const { rowHeight } = theme;

  const { rowTop, rowBottom, columnLeft, columnRight } = tableRanges;
  const { x: scrollLeft, y: scrollTop } = scrollPos;

  const columnPositions = [firstVisibleColumnPos - scrollLeft];
  {
    const offset = -scrollLeft;

    let totalWidth = firstVisibleColumnPos;
    for (let j = columnLeft; j < columnRight - 1; j++) {
      const columnState = columnStates[j];
      const { width: columnWidth } = columnState;

      const columnPosition = totalWidth + columnWidth + offset;
      columnPositions.push(columnPosition);

      totalWidth += columnWidth;
    }
  }
  ct.columnPositions = columnPositions;

  const rowPositions = [];
  {
    const offset = -scrollTop + rowHeight;

    for (let i = rowTop; i < rowBottom; i++) {
      const y = i * rowHeight + offset;
      rowPositions.push(y);
    }
  }
  ct.rowPositions = rowPositions;
}

function updateFonts(ct: CanvasTable) {
  const { theme } = ct;

  const baseFont = {
    family: theme.fontFamily,
    size: theme.fontSize
  };

  const bodyFont = { ...baseFont,
    color: theme.bodyFontColor ?? theme.fontColor,
    style: theme.bodyFontStyle ?? theme.fontStyle
  };
  ct.bodyFont = bodyFont;

  const headerFont = {
    ...baseFont,
    color: theme.headerFontColor ?? theme.fontColor,
    style: theme.headerFontStyle ?? theme.fontStyle
  };
  ct.headerFont = headerFont;
}

function findIndexOfColumnWhoseResizerIsBeingHovered(ct: CanvasTable, mousePos: VectorLike) {
  const { theme } = ct;
  const { rowHeight } = theme;

  const { x: mouseX, y: mouseY } = mousePos;
  if (mouseY < 0 || mouseY >= rowHeight) {
    return -1;
  }

  const { columnStates, columnPositions, tableRanges } = ct;
  const { columnLeft } = tableRanges;

  for (const [j, pos] of columnPositions.entries()) {
    const columnIndex = j + columnLeft;
    const columnState = columnStates[columnIndex];
    const centerX = pos + columnState.width;
    const x1 = centerX - COLUMN_RESIZER_WIDTH;
    const x2 = centerX + COLUMN_RESIZER_WIDTH + 1;

    if (mouseX >= x1 && mouseX <= x2) {
      return columnIndex;
    }
  }

  return -1;
}

function getRelativeMousePos(wrapperEl: HTMLDivElement, eventPos: VectorLike): VectorLike {
  const bcr = wrapperEl.getBoundingClientRect();
  const x = eventPos.x - bcr.x;
  const y = eventPos.y - bcr.y;
  return { x, y };
}

function columnDefsToColumnStates(columnDefs: ColumnDef[]) {
  const columnStates = [] as ColumnState[];
  let total = 0;
  for (const { width, ...rest } of columnDefs) {
    const _width = width ?? DEFAULT_COLUMN_WIDTH;
    columnStates.push({...rest, width: _width });
    total += _width;
  }
  return columnStates;
}
