import { Unsubscribe } from "nanoevents";
import { AnimationLoop } from "./AnimationLoop";
import { defaultTheme } from "./defaultTheme";
import { TableState } from "./lib/TableState";
import { Stage } from "./lib/Stage";
import { TableContext, TableEvents } from "./lib/TableContext";
import { shallowMerge } from "./utils";
import { DEFAULT_COLUMN_WIDTH } from "./constants";
import {
  CreateCanvasTableParams,
  ConfigCanvasTableParams,
  ColumnDef,
  DataRowId,
  PropValue
} from "./types";

export class CanvasTable {
  private tblctx: TableContext;

  private eventUnsubs = new Map<keyof TableEvents, Unsubscribe>();

  constructor(params: CreateCanvasTableParams) {
    const {
      container,
      columnDefs,
      dataRows,
      theme: themeParam,
      selectId: selectIdParam,
      selectProp: selectPropParam,
      onResizeColumn,
      onSelectRow,
      ...rest
    } = params;

    const theme = themeParam ?? defaultTheme;
    const selectId = selectIdParam ?? ((row) => row.id as DataRowId);
    const selectProp = selectPropParam ?? ((row, columnDef) => row[columnDef.key] as PropValue);
    const props = {
      columnDefs,
      dataRows,
      theme,
      selectId,
      selectProp,
      onResizeColumn,
      onSelectRow,
      ...rest
    };

    const columnWidths = CanvasTable.calculateColumnWidths(columnDefs);
    const state = new TableState(columnWidths);

    const stage = new Stage(container);
    this.tblctx = new TableContext(props, state, stage);

    if (onResizeColumn) {
      const unsub = this.tblctx.on("resizecolumn", onResizeColumn);
      this.eventUnsubs.set("resizecolumn", unsub);
    }

    if (onSelectRow) {
      const unsub = this.tblctx.on("selrowchange", onSelectRow);
      this.eventUnsubs.set("selrowchange", unsub);
    }

    const animationLoop = new AnimationLoop(this.tblctx);
    stage.setUpdateCallback(animationLoop.update.bind(animationLoop));

    stage.run();
  }

  private static calculateColumnWidths(columnDefs: ColumnDef[]) {
    const columnWidths = [];
    for (const { width } of columnDefs) {
      columnWidths.push(width ?? DEFAULT_COLUMN_WIDTH);
    }
    return columnWidths;
  }

  public config(params: Partial<ConfigCanvasTableParams>) {
    const { columnDefs, dataRows, theme, onSelectRow, onResizeColumn, ...rest } = params;

    const { props, state, layout } = this.tblctx;

    let shouldReflow = false;

    if (columnDefs && !Object.is(columnDefs, props.columnDefs)) {
      props.columnDefs = columnDefs;

      const columnWidths = CanvasTable.calculateColumnWidths(columnDefs);
      state.columnWidths = columnWidths;

      shouldReflow = true;
    }

    if (dataRows && !Object.is(dataRows, props.dataRows)) {
      props.dataRows = dataRows;

      shouldReflow = true;
    }

    if (theme && !Object.is(theme, props.theme)) {
      props.theme = theme;

      this.tblctx.emit("themechange", theme);

      shouldReflow = true;
    }

    if (shouldReflow) {
      layout.reflow();
    }

    if (onSelectRow) {
      props.onSelectRow = onSelectRow;

      const oldUnsub = this.eventUnsubs.get("selrowchange");
      if (oldUnsub) oldUnsub();

      const newUnsub = this.tblctx.on("selrowchange", onSelectRow);
      this.eventUnsubs.set("selrowchange", newUnsub);
    }

    if (onResizeColumn) {
      props.onResizeColumn = onResizeColumn;

      const oldUnsub = this.eventUnsubs.get("resizecolumn");
      if (oldUnsub) oldUnsub();

      const newUnsub = this.tblctx.on("resizecolumn", onResizeColumn);
      this.eventUnsubs.set("resizecolumn", newUnsub);

      this.tblctx.on("resizecolumn", onResizeColumn);
    }

    shallowMerge(this.tblctx.props, rest);
  }

  public cleanup() {
    this.tblctx.stage.cleanup();
  }
}
