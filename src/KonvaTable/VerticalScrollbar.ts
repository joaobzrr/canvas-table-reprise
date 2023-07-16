import Konva from "konva";
import { GroupConfig } from "konva/lib/Group";
import { TableState } from "./TableState";
import { Utils } from "./Utils";
import { Theme } from "./types";

export interface VerticalScrollbarConfig extends GroupConfig {
  tableState: TableState;
  theme:      Theme;
}

export class VerticalScrollbar extends Konva.Group {
  tableState: TableState;
  theme:      Theme;

  bar:   Konva.Rect;
  track: Konva.Rect;
  thumb: Konva.Rect;

  maxThumbTop = 0;

  constructor(config: VerticalScrollbarConfig) {
    super(config);

    this.tableState = config.tableState;
    this.theme = config.theme;

    this.bar = new Konva.Rect({ fill: "white", strokeWidth: 1 });
    this.add(this.bar);

    this.track = new Konva.Rect();
    this.add(this.track);

    this.thumb = new Konva.Rect({ fill: "black" });
    this.add(this.thumb);

    this.on("widthChange heightChange", this.onResize.bind(this));
  }

  onResize() {
    const { height: viewportHeight } = this.tableState.viewportDimensions;
    const { height: scrollHeight } = this.tableState.scrollDimensions;

    const barWidth = this.theme.scrollBarThickness;

    const barHeight = this.height();

    this.bar.setAttrs({
      x: 0,
      y: 0,
      width: barWidth,
      height: barHeight
    });

    const trackX = this.theme.scrollBarTrackMargin;
    const trackY = this.theme.scrollBarTrackMargin;
    const trackWidth  = barWidth  - (this.theme.scrollBarTrackMargin * 2);
    const trackHeight = barHeight - (this.theme.scrollBarTrackMargin * 2);

    this.track.setAttrs({
      x: trackX,
      y: trackY,
      width: trackWidth,
      height: trackHeight
    });

    const thumbHeight = (viewportHeight / scrollHeight) * trackHeight;

    this.thumb.setAttrs({
      x: trackX,
      y: trackY,
      width: trackWidth,
      height: thumbHeight,
    });

    const trackBottom = trackY + trackHeight;
    this.maxThumbTop = trackBottom - thumbHeight;

    this.repositionThumb();
  }

  onWheel() {
    this.repositionThumb();
  }

  repositionThumb() {
    const { y: normalizedScrollTop } = this.tableState.normalizedScrollPosition;
    this.thumb.y(Utils.scale(normalizedScrollTop, 0, 1, this.track.y(), this.maxThumbTop));
  }
}
