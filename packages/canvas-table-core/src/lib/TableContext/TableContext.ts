import { createNanoEvents, Emitter } from "nanoevents";
import { TableProps } from "../../types";
import { TableState } from "../TableState";
import { Layout } from "../Layout";
import { Stage } from "../Stage";
import { TableEvents } from "./types";

export class TableContext {
  private emitter: Emitter;

  public props: TableProps;
  public state: TableState;
  public stage: Stage;
  public layout: Layout;

  constructor(data: TableProps, state: TableState, stage: Stage) {
    this.emitter = createNanoEvents();
    this.props = data;
    this.state = state;
    this.stage = stage;
    this.layout = new Layout(this);
  }

  public on<K extends keyof TableEvents>(event: K, callback: TableEvents[K]) {
    return this.emitter.on(event, callback);
  }

  public emit<K extends keyof TableEvents>(event: K, ...args: Parameters<TableEvents[K]>) {
    this.emitter.emit(event, ...args);
  }
}
