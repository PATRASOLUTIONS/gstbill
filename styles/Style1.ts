import { StyleSheet } from "@react-pdf/renderer"

const Styles1 = StyleSheet.create({
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
    border: "1px solid #000",
    padding: 5,
    width: "50%",
  },
  gridCellLast: {
    border: "1px solid #000",
    padding: 5,
    width: "50%",
  },
  section: {
    marginBottom: 10,
    padding: 10,
    border: "1px solid #000",
  },
  text: {
    fontSize: 9,
    marginBottom: 3,
  },
  label: {
    fontFamily: "Roboto-Bold",
    marginBottom: 5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderTop: "1px solid #000",
    backgroundColor: "#f0f0f0",
    fontFamily: "Roboto-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
  },
  tableCell: {
    padding: 5,
    borderRight: "1px solid #000",
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
  },
  taxValue: {
    textAlign: "right",
  },
  amountInWords: {
    marginTop: 10,
    padding: 5,
    border: "1px solid #000",
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
  },
  declaration: {
    width: "60%",
    padding: 5,
    border: "1px solid #000",
    marginRight: 10,
  },
  signature: {
    width: "30%",
    padding: 5,
    border: "1px solid #000",
    textAlign: "center",
  },
})

export default Styles1
