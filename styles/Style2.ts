import { StyleSheet } from "@react-pdf/renderer"

const stylesPastel = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#6b46c1",
  },
  gridContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  gridLeft: {
    width: "50%",
    marginRight: 5,
  },
  gridRight: {
    width: "50%",
    marginLeft: 5,
  },
  gridRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  gridCell: {
    border: "1px solid #d6bcfa",
    padding: 5,
    width: "50%",
    backgroundColor: "#faf5ff",
  },
  gridCellLast: {
    border: "1px solid #d6bcfa",
    padding: 5,
    width: "50%",
    backgroundColor: "#faf5ff",
  },
  section: {
    marginBottom: 10,
    padding: 10,
    border: "1px solid #d6bcfa",
    backgroundColor: "#faf5ff",
  },
  text: {
    fontSize: 9,
    marginBottom: 3,
    color: "#4a5568",
  },
  label: {
    fontFamily: "Roboto-Bold",
    marginBottom: 5,
    color: "#6b46c1",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #d6bcfa",
    borderLeft: "1px solid #d6bcfa",
    borderRight: "1px solid #d6bcfa",
    borderTop: "1px solid #d6bcfa",
    backgroundColor: "#9f7aea",
    fontFamily: "Roboto-Bold",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #d6bcfa",
    borderLeft: "1px solid #d6bcfa",
    borderRight: "1px solid #d6bcfa",
    backgroundColor: "#faf5ff",
  },
  tableCell: {
    padding: 5,
    borderRight: "1px solid #d6bcfa",
    textAlign: "center",
  },
  tableCellLast: {
    padding: 5,
    textAlign: "center",
  },
  cellSl: {
    width: "5%",
  },
  cellDesc: {
    width: "35%",
  },
  cellHsn: {
    width: "10%",
  },
  gstRate: {
    width: "10%",
  },
  cellQty: {
    width: "10%",
  },
  cellRate: {
    width: "10%",
  },
  cellPer: {
    width: "10%",
  },
  cellAmount: {
    width: "10%",
  },
  taxDetails: {
    marginTop: 10,
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingHorizontal: 10,
  },
  taxLabel: {
    fontFamily: "Roboto-Bold",
    color: "#6b46c1",
  },
  taxValue: {
    textAlign: "right",
  },
  amountInWords: {
    marginTop: 10,
    padding: 5,
    border: "1px solid #d6bcfa",
    backgroundColor: "#faf5ff",
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
  },
  declaration: {
    width: "60%",
    padding: 5,
    border: "1px solid #d6bcfa",
    marginRight: 10,
    backgroundColor: "#faf5ff",
  },
  signature: {
    width: "30%",
    padding: 5,
    border: "1px solid #d6bcfa",
    textAlign: "center",
    backgroundColor: "#faf5ff",
  },
})

export default stylesPastel
