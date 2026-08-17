import type { ReactNode } from 'react'

export interface ClaimTableColumn<Row> {
  key: string
  header: ReactNode
  /** Cell renderer. The first column is emphasized by the stylesheet. */
  cell: (row: Row) => ReactNode
}

export interface ClaimTableProps<Row> {
  columns: ClaimTableColumn<Row>[]
  rows: Row[]
  /** Stable React key for each row. */
  rowKey: (row: Row, index: number) => string
  caption?: ReactNode
}

/**
 * Wide claim-by-claim table with a sticky header.
 *
 * The wrapper scrolls horizontally on its own so the page body never does,
 * which is the behavior the static pages relied on for the 780px minimum.
 */
export function ClaimTable<Row>({ columns, rows, rowKey, caption }: ClaimTableProps<Row>) {
  return (
    <div className="claim-table-wrap">
      <table className="claim-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map((column) => (
                <td key={column.key}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
