import { useState } from "react";
import { debounce } from "lodash";
import CanvasTable, { DataRow, Theme } from "canvas-table-react";
import { columnDefs, dataRows } from "./data/pokemon";
import { useElementSize } from "./useElementSize";
import styles from "./App.module.css";

function App() {
  const [containerSize, containerRef] = useElementSize();
  const [theme, setTheme] = useState<Partial<Theme>>();

  const [selectedRow, setSelectedRow] = useState<DataRow>();

  const updateTheme = debounce((theme: Partial<Theme>) => {
    setTheme(prevTheme => ({ ...prevTheme, ...theme }));
  }, 250);
  
  return (
    <div className={styles.app}>
      <div className={styles["left-sidebar"]}>
        <form>
          <div className={styles.row}>
            <label className={styles.label}>Background Color</label>
            <input
              onChange={event => updateTheme({
                tableBackgroundColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Body Background Color</label>
            <input
              onChange={event => updateTheme({
                bodyBackgroundColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Header Background Color</label>
            <input
              onChange={event => updateTheme({
                headerBackgroundColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Hovered Row Color</label>
            <input
              onChange={event => updateTheme({
                hoveredRowColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Selected Row Color</label>
            <input
              onChange={event => updateTheme({
                selectedRowColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Border Color</label>
            <input
              onChange={event => updateTheme({
                tableBorderColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Font Family</label>
            <input
              onChange={event => updateTheme({
                fontFamily: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Font Size</label>
            <input
              onChange={event => updateTheme({
                fontSize: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Font Color</label>
            <input
              onChange={event => updateTheme({
                fontColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Body Font Color</label>
            <input
              onChange={event => updateTheme({
                bodyFontColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Header Font Color</label>
            <input
              onChange={event => updateTheme({
                headerFontColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Font Style</label>
            <input
              onChange={event => updateTheme({
                fontStyle: (event.target.value as any) || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Body Font Style</label>
            <input
              onChange={event => updateTheme({
                bodyFontStyle: (event.target.value as any) || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Header Font Style</label>
            <input
              onChange={event => updateTheme({
                headerFontStyle: (event.target.value as any) || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Scrollbar Thickness</label>
            <input
              onChange={event => updateTheme({
                scrollbarThickness: parseInt(event.target.value) || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Scrollbar Track Margin</label>
            <input
              onChange={event => updateTheme({
                scrollbarTrackMargin: parseInt(event.target.value) || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Scrollbar Thumb Color</label>
            <input
              onChange={event => updateTheme({
                scrollbarThumbColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Scrollbar Track Color</label>
            <input
              onChange={event => updateTheme({
                scrollbarTrackColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Scrollbar Thumb Hover Color</label>
            <input
              onChange={event => updateTheme({
                scrollbarThumbHoverColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
          <div className={styles.row}>
            <label className={styles.label}>Scrollbar Thumb Pressed Color</label>
            <input
              onChange={event => updateTheme({
                scrollbarThumbPressedColor: event.target.value || undefined
              })}
              className={styles.input}
            />
          </div>
        </form>
      </div>
      <main className={styles.main}>
        <CanvasTable
          columnDefs={columnDefs}
          dataRows={dataRows}
          size={containerSize}
          theme={theme}
          onSelect={(_, row) => setSelectedRow(row)}
          containerClassName={styles["canvas-table"]}
          ref={containerRef}
          {...containerSize}
        />
      </main>
      <div className={styles["right-sidebar"]}>
        {selectedRow && (
          <form>
            {columnDefs.map(({ title, field }) => (
              <div className={styles.row}>
                <label className={styles.label}>{title}</label>
                <input
                  value={selectedRow[field]}
                  className={styles.input}
                  disabled={true}
                />
              </div>
            ))}
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
