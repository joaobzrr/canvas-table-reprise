import Konva from "konva";
import { GroupConfig } from "konva/lib/Group";
import { Theme } from ".";

export interface HeadCellConfig extends GroupConfig {
  theme: Theme;
  text: string;
}

export class HeadCell extends Konva.Group {
  theme: Theme;

  constructor(config: HeadCellConfig) {
    super(config);

    this.theme = config.theme;

    this.add(new Konva.Text({
      width: this.width(),
      height: this.height(),
      padding: this.theme.cellPadding,
      text: config.text,
      fontSize: this.theme.fontSize,
      fontFamily: this.theme.fontFamily,
      fontStyle: "bold",
      fill: this.theme.fontColor,
      verticalAlign: "middle",
      wrap: "none",
      ellipsis: true,
      listening: false
    }));
  }
}