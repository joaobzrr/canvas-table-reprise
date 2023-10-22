import styles from "./TableList.module.css";
import { Table } from "./types";

type PropsType = {
  tables: Table[];
  value?: string;
  onChange?: (table: string) => void;
}

export default function TableList(props: PropsType) {
  const { tables, value, onChange } = props;

  return (
    <div className={styles["table-list"]}>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
      {
        tables.map(({ id, name }) => (
          <option
            value={id}
            label={name}
            key={id}
          />
        ))
      }
      </select>
    </div>
  );
}