import "./styles.css";
import { fabric } from "fabric";

// initialize fabric canvas and assign to global windows object for debug
const canvas = (window._canvas = new fabric.Canvas("c"));

// ADD YOUR CODE HERE
const events = {
    object: ["added", "moving", "moved", "scaled", "selected", "over"],
    mouse: ["down", "up", "moving", "over", "out"]
};

const bindEvents = () => {
    canvas.on('mouse:up', onMouseUp);
    canvas.on('mouse:down', onMouseDown);
    canvas.on('selection:cleared', onSelectionCleared);

    events.object.forEach((event) => {
        if (event === "added") {
            canvas.on(`object:${event}`, onObjectAdded);
        } else if (event === "moving") {
            canvas.on(`object:${event}`, onObjectMoving);
        } else if (event === "mouseover") {
            // canvas.on(`object:${event}`, onObjectMouseOver);
        } else if (event === "moved") {
            canvas.on(`object:${event}`, onObjectMoved);
        }
    });
}

const createRect = (left, top, color) => {
    const options = {
        originX: "left",
        originY: "top",
        left: left,
        top: top,
        width: Math.max(Math.floor(Math.random() * 2) * 100 + 100, 100),
        height: Math.max(Math.floor(Math.random() * 2) * 100 + 100, 100),
    };

    if (color) {
        options["fill"] = color;
    }

    const rect = new fabric.Rect(options);

    rect.guides = {};

    canvas.add(rect);
    canvas.renderAll();
}

const init = () => {
    bindEvents();
    createRect(200, 200, "rgba(0, 0, 0, 0.8)");
    createRect(
        Math.floor(Math.random() * canvas.width),
        Math.floor(Math.random() * canvas.height),
        "rgba(0, 255, 0, 0.6)"
    );
    createRect(
        Math.floor(Math.random() * canvas.width),
        Math.floor(Math.random() * canvas.height),
        "rgba(255, 0, 0, 0.6)"
    );
}

const onMouseUp = (e) => {
    console.log(e);

    const objects = canvas.getObjects().filter(o => o.type !== "line");

    // Clear drawed guidelines when mouse up
    objects.forEach(obj => {
        ['top', 'bottom', 'left', 'right', 'centerX', 'centerY'].forEach(side => {
            const guideLine = obj.guides[side];
            if (guideLine instanceof fabric.Line) {
                guideLine.set('opacity', 0);
            }
        });
    });

    canvas.renderAll();
}

const onMouseDown = (e) => {
    console.log('**** onMouseDown ****', e)
}

const onSelectionCleared = (e) => {
    console.log('**** onSelectionCleared ****', e)
    // Clear the guides when the selection is cleared
    const objects = canvas.getObjects().filter(o => o.type !== "line");
    objects.forEach(obj => {
        if (obj.guides) {
            for (let side in obj.guides) {
                if (obj.guides[side] instanceof fabric.Line) {
                    canvas.remove(obj.guides[side]);
                }
            }
        }

        obj.guides = {};
        drawObjectGuides(obj);
    });

    canvas.renderAll();
};

const onObjectAdded = (e) => {
    // Add the smart guides around the object
    const obj = e.target;

    if (!(obj instanceof fabric.Rect)) return false;

    drawObjectGuides(obj);
}

const onObjectMoved = (e) => {
    // Add the smart guides around the object
    const obj = e.target;

    if (!(obj instanceof fabric.Rect)) return false;

    drawObjectGuides(obj);
}

const onObjectMoving = (e) => {
    const obj = e.target;

    if (!(obj instanceof fabric.Rect)) return false;

    drawObjectGuides(obj);

    const objects = canvas.getObjects().filter((o) => o.type !== "line" && o !== obj);

    for (const i of objects) {
        const matches = [];

        for (const side in obj.guides) {
            let axis, newPos;

            switch (side) {
                case "right":
                    axis = "left";
                    newPos = i.guides[side][axis] - obj.getScaledWidth();
                    break;
                case "bottom":
                    axis = "top";
                    newPos = i.guides[side][axis] - obj.getScaledHeight();
                    break;
                case "centerX":
                    axis = "left";
                    newPos = i.guides[side][axis] - obj.getScaledWidth() / 2;
                    break;
                case "centerY":
                    axis = "top";
                    newPos = i.guides[side][axis] - obj.getScaledHeight() / 2;
                    break;
                default:
                    axis = side;
                    newPos = i.guides[side][axis];
                    break;
            }

            if (inRange(obj.guides[side][axis], i.guides[side][axis])) {
                matches.push({
                    side: side,
                    axis: axis,
                    range: Math.abs(obj.guides[side][axis] - i.guides[side][axis]),
                    newPos: newPos
                });
                // matches.add(side);
                // snapObject(obj, axis, newPos);
            }

            if (side === "left") {
                if (inRange(obj.guides["left"][axis], i.guides["right"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["left"][axis] - i.guides["right"][axis]),
                        newPos: i.guides["right"][axis]
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["right"][axis]);
                } else if(inRange(obj.guides["left"][axis], i.guides["centerX"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["left"][axis] - i.guides["centerX"][axis]),
                        newPos: i.guides["centerX"][axis]
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["centerX"][axis]);
                } 
            } else if (side === "right") {
                if (inRange(obj.guides["right"][axis], i.guides["left"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["right"][axis] - i.guides["left"][axis]),
                        newPos: i.guides["left"][axis] - obj.getScaledWidth()
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["left"][axis] - obj.getScaledWidth());
                } else if (inRange(obj.guides["right"][axis], i.guides["centerX"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["right"][axis] - i.guides["centerX"][axis]),
                        newPos: i.guides["centerX"][axis] - obj.getScaledWidth()
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["centerX"][axis] - obj.getScaledWidth());
                } 
            } else if (side === "top") {
                if (inRange(obj.guides["top"][axis], i.guides["bottom"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["top"][axis] - i.guides["bottom"][axis]),
                        newPos: i.guides["bottom"][axis]
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["bottom"][axis]);
                } else if (inRange(obj.guides["top"][axis], i.guides["centerY"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["top"][axis] - i.guides["centerY"][axis]),
                        newPos: i.guides["centerY"][axis]
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["centerY"][axis]);
                }
            } else if (side === "bottom") {
                if (inRange(obj.guides["bottom"][axis], i.guides["top"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["bottom"][axis] - i.guides["top"][axis]),
                        newPos: i.guides["top"][axis] - obj.getScaledHeight()
                    })
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["top"][axis] - obj.getScaledHeight());
                } else if (inRange(obj.guides["bottom"][axis], i.guides["centerY"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["bottom"][axis] - i.guides["centerY"][axis]),
                        newPos: i.guides["centerY"][axis] - obj.getScaledHeight()
                    });
                    // matches.add(side);
                    // snapObject(obj, axis, i.guides["centerY"][axis] - obj.getScaledHeight());
                }
            } else if (side === "centerX") {
                if (inRange(obj.guides["centerX"][axis], i.guides["left"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["centerX"][axis] - i.guides["left"][axis]),
                        newPos: i.guides["left"][axis] - obj.getScaledWidth() / 2
                    });
                    // matches.add(side);
                    // snapObject(
                    //     obj,
                    //     axis,
                    //     i.guides["left"][axis] - obj.getScaledWidth() / 2
                    // );
                } else if (inRange(obj.guides["centerX"][axis], i.guides["right"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["centerX"][axis] - i.guides["right"][axis]),
                        newPos: i.guides["right"][axis] - obj.getScaledWidth() / 2
                    });
                    // matches.add(side);
                    // snapObject(
                    //     obj,
                    //     axis,
                    //     i.guides["right"][axis] - obj.getScaledWidth() / 2
                    // );
                }
            } else if (side === "centerY") {
                if (inRange(obj.guides["centerY"][axis], i.guides["top"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["centerY"][axis] - i.guides["top"][axis]),
                        newPos: i.guides["top"][axis] - obj.getScaledHeight() / 2
                    });
                    // matches.add(side);
                    // snapObject(
                    //     obj,
                    //     axis,
                    //     i.guides["top"][axis] - obj.getScaledHeight() / 2
                    // );
                } else if (inRange(obj.guides["centerY"][axis], i.guides["bottom"][axis])) {
                    matches.push({
                        side: side,
                        axis: axis,
                        range: Math.abs(obj.guides["centerY"][axis] - i.guides["bottom"][axis]),
                        newPos: i.guides["bottom"][axis] - obj.getScaledHeight() / 2
                    });
                    // matches.add(side);
                    // snapObject(
                    //     obj,
                    //     axis,
                    //     i.guides["bottom"][axis] - obj.getScaledHeight() / 2
                    // );
                }
            }

            if (matches.length === 1) {
                snapObject(
                    obj,
                    matches[0].axis,
                    matches[0].newPos
                );
            } else if (matches.length > 1) {
                matches.sort((a, b) => a.range - b.range);

                for(const match of matches) {
                    snapObject(
                        obj,
                        match.axis,
                        match.newPos
                    );      
                }
            }
            // snapObject(
            //     obj,
            //     axis,
            //     i.guides["top"][axis] - obj.getScaledHeight() / 2
            // );
        }
    }

    obj.setCoords();
}

// If the 2 different coordinates are in range
const inRange = (a, b) => {
    return Math.abs(a - b) <= 10;
}

const snapObject = (obj, side, pos) => {
    obj.set(side, pos);
    obj.setCoords();
    drawObjectGuides(obj);
}

const drawObjectGuides = (obj) => {
    drawGuide("top",  obj);
    drawGuide("left",obj);
    drawGuide("centerX",  obj);
    drawGuide("centerY", obj);
    drawGuide("right", obj);
    drawGuide("bottom",  obj);
    obj.setCoords();
}

const drawGuide = (side, obj) => {
    const objects = canvas.getObjects().filter((o) => o.type !== "line" && o !== obj);

    const objLeft = obj.left;
    const objRight = obj.left + obj.getScaledWidth();  
    const objCenterX = (objLeft + objRight) / 2;

    const objTop = obj.top;
    const objBottom = obj.top + obj.getScaledHeight();
    const objCenterY = (objTop + objBottom) / 2;

    let value;
    let pointArray = [];

    switch (side) {
        case "top":
            value = objTop;
            pointArray.push(objLeft);
            pointArray.push(objRight);
            pointArray.push(objCenterX);
            break;
        case "bottom":
            value = objBottom;
            pointArray.push(objLeft);
            pointArray.push(objRight);
            pointArray.push(objCenterX);
            break;
        case "centerY":
            value = objCenterY;
            pointArray.push(objLeft);
            pointArray.push(objRight);
            pointArray.push(objCenterX);
            break;
        case "left":
            value = objLeft;
            pointArray.push(objTop);
            pointArray.push(objBottom);
            pointArray.push(objCenterY);
            break;
        case "right":
            value = objRight;
            pointArray.push(objTop);
            pointArray.push(objBottom);
            pointArray.push(objCenterY);
            break;
        case "centerX":
            value = objCenterX;
            pointArray.push(objTop);
            pointArray.push(objBottom);
            pointArray.push(objCenterY);
            break;
    }

    let minDiff = 100;

    for (const target of objects) {
        const targetLeft = target.left;
        const targetRight = target.left + target.getScaledWidth();
        const targetCenterX = (targetLeft + targetRight) / 2;

        const targetTop = target.top;
        const targetBottom = target.top + target.getScaledHeight();
        const targetCenterY = (targetTop + targetBottom) / 2;

        switch (side) {
            case "top":
            case "bottom":
            case "centerY":        
                if (inRange(value, targetTop) || inRange(value, targetBottom) || inRange(value, targetCenterY)) {
                  pointArray.push(targetLeft);
                  pointArray.push(targetRight);
                  pointArray.push(targetCenterX);
                }

                minDiff = Math.min(minDiff, Math.abs(targetTop - value));
                minDiff = Math.min(minDiff, Math.abs(targetBottom - value));
                minDiff = Math.min(minDiff, Math.abs(targetCenterY - value));
                break;
            case "left":
            case "right":
            case "centerX":
                if (inRange(value, targetLeft) || inRange(value, targetRight) || inRange(value, targetCenterX)) {
                  pointArray.push(targetBottom);
                  pointArray.push(targetTop);
                  pointArray.push(targetCenterY);
                }

                minDiff = Math.min(minDiff, Math.abs(targetLeft - value));
                minDiff = Math.min(minDiff, Math.abs(targetRight - value));
                minDiff = Math.min(minDiff, Math.abs(targetCenterX - value));
                break;
        }     
    }

    const sortedPointArray = pointArray.sort((a, b) => a - b);   

    let ln;
    const lineProps = {
        evented: true,
        stroke: 'red',
        selectable: false,
        opacity: 1
    };

    switch (side) {
        case "top":
        case "bottom":
        case "centerY":
            ln = new fabric.Line(
                [sortedPointArray[0], value, sortedPointArray[sortedPointArray.length - 1], value],
                Object.assign(lineProps, {
                    stroke: 'blue'
                })
            );
            break;
        case "left":
        case "right":
        case "centerX":
            ln = new fabric.Line(
                [value, sortedPointArray[0], value, sortedPointArray[sortedPointArray.length - 1]],
                Object.assign(lineProps, {
                    stroke: 'blue'
                })
            );
            break;
    }

    if (obj.guides[side] instanceof fabric.Line) {
        // remove the line
        canvas.remove(obj.guides[side]);
        delete obj.guides[side];
    }
    obj.guides[side] = ln;

    if(sortedPointArray.length > 3 && minDiff == 0){
        obj.guides[side].set("opacity", 1);
    } 
    else obj.guides[side].set("opacity", 0);

    canvas.add(ln).renderAll();  
}

init();
