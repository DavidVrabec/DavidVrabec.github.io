document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const colorPicker = document.getElementById("colorPicker");
    const addBoxBtn = document.getElementById("addBoxBtn");
    const connections = document.getElementById("connections");

    let selectedColor = "#ffffff";
    let draggingLine = null;
    let startConnector = null;
    let selectedLine = null;
    let selectedBox = null;

    colorPicker.addEventListener("input", (event) => {
        selectedColor = event.target.value;
    });

    function createBox(x = 50, y = 50) {
        const boxWrapper = document.createElement("div");
        boxWrapper.classList.add("box-wrapper");
        boxWrapper.style.left = `${x}px`;
        boxWrapper.style.top = `${y}px`;

        const box = document.createElement("div");
        box.classList.add("box");
        box.contentEditable = false;
        box.spellcheck = false;
        box.style.backgroundColor = selectedColor;

        boxWrapper.appendChild(box);

        // Make box editable on double-click
        box.addEventListener("dblclick", (event) => {
            event.stopPropagation();
            box.contentEditable = true;
            box.focus();
        });

        // Disable editing on blur (when clicking outside the box)
        box.addEventListener("blur", () => {
            box.contentEditable = false;
        });

        // Handle box selection and dragging on single-click
        boxWrapper.addEventListener("mousedown", (event) => {
            event.stopPropagation();
            if (selectedBox) selectedBox.classList.remove("selected");
            selectedBox = boxWrapper;
            selectedBox.classList.add("selected");
            onMouseDown(event, boxWrapper);
        });

        // Add connector points
        ["top", "bottom", "left", "right"].forEach(position => {
            const connector = document.createElement("div");
            connector.classList.add("connector-point", `connector-${position}`);
            connector.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                startConnection(e, connector);
            });
            boxWrapper.appendChild(connector);
        });

        canvas.appendChild(boxWrapper);
    }

    function startConnection(event, connector) {
        const canvasRect = canvas.getBoundingClientRect();
        const rect = connector.getBoundingClientRect();
        const startX = rect.left + rect.width / 2 - canvasRect.left;
        const startY = rect.top + rect.height / 2 - canvasRect.top;

        draggingLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        draggingLine.setAttribute("x1", startX);
        draggingLine.setAttribute("y1", startY);
        draggingLine.setAttribute("x2", startX);
        draggingLine.setAttribute("y2", startY);
        draggingLine.setAttribute("stroke", "black");
        draggingLine.setAttribute("stroke-width", "2");

        // Select the line on click
        draggingLine.addEventListener("click", () => {
            if (selectedLine) selectedLine.setAttribute("stroke", "black");
            selectedLine = draggingLine;
            selectedLine.setAttribute("stroke", "red");
        });

        connections.appendChild(draggingLine);
        startConnector = connector;

        document.addEventListener("mousemove", dragConnection);
        document.addEventListener("mouseup", endConnection);
    }

    function dragConnection(event) {
        if (draggingLine) {
            const canvasRect = canvas.getBoundingClientRect();
            const x2 = event.clientX - canvasRect.left;
            const y2 = event.clientY - canvasRect.top;
            draggingLine.setAttribute("x2", x2);
            draggingLine.setAttribute("y2", y2);
        }
    }

    function endConnection(event) {
        document.removeEventListener("mousemove", dragConnection);
        document.removeEventListener("mouseup", endConnection);

        if (!draggingLine) return;

        const endConnector = document.elementFromPoint(event.clientX, event.clientY);
        if (endConnector && endConnector.classList.contains("connector-point") && endConnector !== startConnector) {
            const canvasRect = canvas.getBoundingClientRect();
            const rect1 = startConnector.getBoundingClientRect();
            const rect2 = endConnector.getBoundingClientRect();

            const x1 = rect1.left + rect1.width / 2 - canvasRect.left;
            const y1 = rect1.top + rect1.height / 2 - canvasRect.top;
            const x2 = rect2.left + rect2.width / 2 - canvasRect.left;
            const y2 = rect2.top + rect2.height / 2 - canvasRect.top;

            draggingLine.setAttribute("x1", x1);
            draggingLine.setAttribute("y1", y1);
            draggingLine.setAttribute("x2", x2);
            draggingLine.setAttribute("y2", y2);

            bindLineToBox(draggingLine, startConnector, endConnector);
        } else {
            draggingLine.remove();
        }

        draggingLine = null;
        startConnector = null;
    }

    function bindLineToBox(line, connector1, connector2) {
        const updateLine = () => {
            const canvasRect = canvas.getBoundingClientRect();
            const rect1 = connector1.getBoundingClientRect();
            const rect2 = connector2.getBoundingClientRect();

            const x1 = rect1.left + rect1.width / 2 - canvasRect.left;
            const y1 = rect1.top + rect1.height / 2 - canvasRect.top;
            const x2 = rect2.left + rect2.width / 2 - canvasRect.left;
            const y2 = rect2.top + rect2.height / 2 - canvasRect.top;

            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);
        };

        const box1 = connector1.parentElement;
        const box2 = connector2.parentElement;

        const observer1 = new MutationObserver(updateLine);
        const observer2 = new MutationObserver(updateLine);

        observer1.observe(box1, { attributes: true, attributeFilter: ["style"] });
        observer2.observe(box2, { attributes: true, attributeFilter: ["style"] });

        updateLine();
    }

    function onMouseDown(event, boxWrapper) {
        const startX = event.clientX;
        const startY = event.clientY;

        const initialLeft = parseInt(boxWrapper.style.left, 10) || 0;
        const initialTop = parseInt(boxWrapper.style.top, 10) || 0;

        function onMouseMove(e) {
            boxWrapper.style.left = `${initialLeft + e.clientX - startX}px`;
            boxWrapper.style.top = `${initialTop + e.clientY - startY}px`;
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    addBoxBtn.addEventListener("click", () => {
        createBox();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Delete" && selectedLine) {
            selectedLine.remove();
            selectedLine = null;
        }
    });
});
