"use strict";
exports.__esModule = true;
var react_1 = require("react");
var api_1 = require("../../services/api");
var fmt = function (n) { return "S/" + n.toFixed(2).replace(".", ","); };
var formatFecha = function (fecha) {
    if (!fecha)
        return "—";
    return new Date(fecha).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};
var HistorialOrdenes = function () {
    var _a = react_1.useState([]), ordenes = _a[0], setOrdenes = _a[1];
    var _b = react_1.useState(true), loading = _b[0], setLoading = _b[1];
    var _c = react_1.useState(""), error = _c[0], setError = _c[1];
    react_1.useEffect(function () {
        // api.ts agrega el JWT automáticamente
        api_1["default"]
            .get("/cart/client/orders")
            .then(function (res) { return setOrdenes(res.data); })["catch"](function (err) {
            console.error("Error al cargar historial:", err);
            setError("No se pudo cargar el historial de órdenes.");
        })["finally"](function () { return setLoading(false); });
    }, []);
    if (loading)
        return (react_1["default"].createElement("div", { className: "container", style: { textAlign: "center", padding: "60px 24px" } },
            react_1["default"].createElement("p", null, "Cargando historial...")));
    if (error)
        return (react_1["default"].createElement("div", { className: "container", style: { textAlign: "center", padding: "60px 24px", color: "#c0392b" } },
            react_1["default"].createElement("p", null, error)));
    return (react_1["default"].createElement("div", { className: "container", style: { padding: "48px 24px" } },
        react_1["default"].createElement("div", { className: "page-title-label" }, "Mi cuenta"),
        react_1["default"].createElement("h1", { className: "page-title", style: { marginBottom: 32 } }, "Historial de \u00D3rdenes"),
        ordenes.length === 0 ? (react_1["default"].createElement("div", { style: { textAlign: "center", padding: "40px 0", color: "var(--muted)" } },
            react_1["default"].createElement("p", null, "A\u00FAn no tienes \u00F3rdenes registradas."))) : (react_1["default"].createElement("div", { style: { overflowX: "auto" } },
            react_1["default"].createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 14, fontFamily: "DM Sans, sans-serif" } },
                react_1["default"].createElement("thead", null,
                    react_1["default"].createElement("tr", { style: { borderBottom: "2px solid var(--border, #e8e0d5)", textAlign: "left" } },
                        react_1["default"].createElement("th", { style: { padding: "10px 16px", color: "var(--muted)" } }, "N\u00B0 Orden"),
                        react_1["default"].createElement("th", { style: { padding: "10px 16px", color: "var(--muted)" } }, "Fecha"),
                        react_1["default"].createElement("th", { style: { padding: "10px 16px", color: "var(--muted)" } }, "Productos"),
                        react_1["default"].createElement("th", { style: { padding: "10px 16px", color: "var(--muted)" } }, "M\u00E9todo de pago"),
                        react_1["default"].createElement("th", { style: { padding: "10px 16px", color: "var(--muted)", textAlign: "right" } }, "Total"),
                        react_1["default"].createElement("th", { style: { padding: "10px 16px", color: "var(--muted)" } }, "Estado"))),
                react_1["default"].createElement("tbody", null, ordenes.map(function (orden) { return (react_1["default"].createElement("tr", { key: orden.id, style: { borderBottom: "1px solid var(--border, #e8e0d5)" } },
                    react_1["default"].createElement("td", { style: { padding: "14px 16px", fontWeight: 600 } },
                        "#",
                        orden.id),
                    react_1["default"].createElement("td", { style: { padding: "14px 16px" } }, formatFecha(orden.creadoEn)),
                    react_1["default"].createElement("td", { style: { padding: "14px 16px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: orden.productos }, orden.productos),
                    react_1["default"].createElement("td", { style: { padding: "14px 16px", textTransform: "capitalize" } }, orden.metodoPago),
                    react_1["default"].createElement("td", { style: { padding: "14px 16px", textAlign: "right", fontWeight: 600 } }, fmt(orden.montoTotal)),
                    react_1["default"].createElement("td", { style: { padding: "14px 16px" } },
                        react_1["default"].createElement("span", { style: {
                                display: "inline-block", padding: "2px 10px", borderRadius: 12,
                                fontSize: 12, fontWeight: 600,
                                background: orden.estado === "COMPLETADO" ? "#e8f5e9" : orden.estado === "PENDIENTE" ? "#fff8e1" : "#fce4ec",
                                color: orden.estado === "COMPLETADO" ? "#2e7d32" : orden.estado === "PENDIENTE" ? "#f57f17" : "#c62828"
                            } }, orden.estado)))); })))))));
};
exports["default"] = HistorialOrdenes;
