import Konva from "konva";
import { GroupConfig } from "konva/lib/Group";
import { TableState, Rect } from "../core";
import { Utils } from "../Utils";
import { Theme } from "../types";
import { Line } from "./Line";

export interface VerticalScrollbarConfig extends GroupConfig {
  tableState: TableState;
  theme: Theme;
}

export class VerticalScrollbar extends Konva.Group {
  private tableState: TableState;
  private theme: Theme;

  private bar:   Konva.Rect;
  private thumb: Konva.Rect;
  private track: Rect;

  private leftBorder:   Line;
  private topBorder:    Line;
  private bottomBorder: Line;

  private maxThumbTop = 0;

  constructor(config: VerticalScrollbarConfig) {
    super(config);

    this.tableState = config.tableState;
    this.theme = config.theme;

    this.bar = new Konva.Rect({
      fill: this.theme.scrollBarTrackColor,
    });
    this.add(this.bar);

    this.track = Rect.create();

    this.thumb = new Konva.Rect({
      fill: this.theme.scrollBarThumbColor
    });
    this.add(this.thumb);

    this.leftBorder = new Line();
    this.add(this.leftBorder);

    this.topBorder = new Line();
    this.add(this.topBorder);

    this.bottomBorder = new Line();
    this.add(this.bottomBorder);

    this.on("widthChange heightChange", this.onResize.bind(this));
  }

  public onResize() {
    this.updateBar();
    this.updateTrack();
    this.updateBorders();
  }

  public repositionThumb() {
    const { y: normalizedScrollTop } = this.tableState.normalizedScrollPosition;
    this.thumb.y(Utils.scale(normalizedScrollTop, 0, 1, this.track.y, this.maxThumbTop));
  }

  public updateThumb() {
    const { height: viewportHeight } = this.tableState.viewportDimensions;
    const { height: scrollHeight } = this.tableState.scrollDimensions;

    const thumbHeight = (viewportHeight / scrollHeight) * this.track.height;

    this.thumb.setAttrs({
      x: this.track.x,
      width: this.track.width,
      height: thumbHeight,
    });

    this.maxThumbTop = this.track.bottom - this.thumb.height();
  }

  private updateBar() {
    this.bar.setAttrs({ width: this.width(), height: this.height() });
  }

  private updateTrack() {
    const trackX = this.theme.scrollBarTrackMargin + 1;
    const trackY = this.bar.y() + this.theme.scrollBarTrackMargin;
    const trackWidth  = this.bar.width()  - trackX - this.theme.scrollBarTrackMargin;
    const trackHeight = this.bar.height() - (this.theme.scrollBarTrackMargin * 2);

    this.track.set({
      x: trackX,
      y: trackY,
      width: trackWidth,
      height: trackHeight
    });
  }

  private updateBorders() {
    this.leftBorder.setAttrs({
      y: this.bar.y(),
      width: 1,
      height: this.height(),
      fill: this.theme.tableBorderColor
    });
    
    this.topBorder.setAttrs({
      y: this.bar.y(),
      width: this.width(),
      height: 1,
      fill: this.theme.tableBorderColor
    });

    this.bottomBorder.setAttrs({
      y: this.height(),
      width: this.width(),
      height: 1,
      fill: this.theme.tableBorderColor,
    });
  }
}
