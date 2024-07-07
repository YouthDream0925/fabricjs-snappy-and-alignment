import "./styles.css";
import { fabric } from "fabric";

// initialize fabric canvas and assign to global windows object for debug
const canvas = (window._canvas = new fabric.Canvas("c", { preserveObjectStacking: true }));
canvas.setWidth(window.innerWidth);
canvas.setHeight(window.innerHeight);
canvas.renderAll();

const sides = ["left", "right", "centerX", "top", "bottom", "centerY"];

const bindEvents = () => {
    canvas.on('mouse:up', onMouseUp);
    canvas.on('object:moving', onObjectMoving);
    canvas.on('selection:cleared', onSelectionCleared);
}

const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const createRect = (left, top, color, width, height) => {
    const options = {
        originX: "left",
        originY: "top",
        left: left,
        top: top,
        width: width,
        height: height,
    };

    if (color) {
        options["fill"] = color;
    }

    const rect = new fabric.Rect(options);

    rect.guides = {};
    rect.guidePoints = {};

    canvas.add(rect);
    canvas.renderAll();
}

const onScreenResize = () => {
    canvas.setHeight(window.innerHeight);
    canvas.setWidth(window.innerWidth);
    canvas.renderAll();
}

const preventBrowserZoom = (event) => {
    if (event.ctrlKey) {
        event.preventDefault();
    }
}

const init = () => {
    bindEvents();
    createRect(200, 200, "rgba(0, 0, 255, 1)", getRandomNumber(500, 1000), getRandomNumber(500, 1000));
    createRect(
        Math.floor(Math.random() * canvas.width),
        Math.floor(Math.random() * canvas.height),
        "rgba(0, 255, 0, 1)",
        getRandomNumber(500, 1000),
        getRandomNumber(500, 1000)
    );
    createRect(
        Math.floor(Math.random() * canvas.width),
        Math.floor(Math.random() * canvas.height),
        "rgba(255, 0, 0, 1)",
        getRandomNumber(500, 1000),
        getRandomNumber(500, 1000)
    );

    window.addEventListener('resize', onScreenResize)
    window.addEventListener('wheel', preventBrowserZoom, { passive: false });
}

const clearCanvas = () => {
    const objects = canvas.getObjects().filter(o => o.type !== "line");
    objects.forEach(obj => {
        if (obj.guides) {
            for (let side in obj.guides) {
                if (obj.guides[side] instanceof fabric.Line) {
                    canvas.remove(obj.guides[side]);
                }
            }
        }
        if (obj.guidePoints) {
            for (let side in obj.guidePoints) {
                obj.guidePoints[side].forEach(mark=>{
                    canvas.remove(mark);
                })
            }
        }
    });

    canvas.renderAll();
}

const onMouseUp = (e) => {
    clearCanvas();
}

const onSelectionCleared = (e) => {
    clearCanvas();
}

const onObjectMoving = (e) => {
    const obj = e.target;

    if (!(obj instanceof fabric.Rect)) return false;

    obj.set("left", Math.round(obj.left));
    obj.set("top", Math.round(obj.top));

    snapObject(obj);
    drawGuides(obj);
}

// If the 2 different coordinates are in range
const inRange = (a, b) => {
    return a === b;
}

const snapObject = (obj) => {
    let objVerticals = [obj.left, obj.left + Math.round(obj.getScaledWidth()), obj.left + Math.round(obj.getScaledWidth()) / 2.0];
    let objHorizontals = [obj.top, obj.top + Math.round(obj.getScaledHeight()), obj.top + Math.round(obj.getScaledHeight()) / 2.0];

    const targets = canvas.getObjects().filter((o) => o.type !== "line" && o !== obj);

    let minAbsDiffVertical = 999;
    let minAbsDiffHorizontal = 999;
    let newPosVertical = 0;
    let newPosHorizontal = 0;

    for (const target of targets) {
        const targetVerticals = [target.left, target.left + Math.round(target.getScaledWidth()), target.left + Math.round(target.getScaledWidth()) / 2.0];
        const targetHorizontals = [target.top, target.top + Math.round(target.getScaledHeight()), target.top + Math.round(target.getScaledHeight()) / 2.0];
        targetVerticals.forEach(targetVertical => {
            objVerticals.forEach(objVertical => {
                if(Math.abs(targetVertical - objVertical) < minAbsDiffVertical) {
                    minAbsDiffVertical = Math.abs(targetVertical - objVertical);
                    newPosVertical = obj.left + targetVertical - objVertical;
                }
            })
        });
        targetHorizontals.forEach(targetHorizontal => {
            objHorizontals.forEach(objHorizontal => {
                if(Math.abs(targetHorizontal - objHorizontal) < minAbsDiffHorizontal) {
                    minAbsDiffHorizontal = Math.abs(targetHorizontal - objHorizontal);
                    newPosHorizontal = obj.top + targetHorizontal - objHorizontal;
                }
            })
        });
    }
    if(minAbsDiffHorizontal < 85) obj.set("top", newPosHorizontal);
    if(minAbsDiffVertical < 85) obj.set("left", newPosVertical);

    obj.setCoords();
}

const drawGuides = (obj) => {
    const targets = canvas.getObjects().filter((o) => o.type !== "line" && o !== obj);

    const objLeft = obj.left;
    const objRight = obj.left + Math.round(obj.getScaledWidth());  
    const objCenterX = (objLeft + objRight) / 2.0;

    const objTop = obj.top;
    const objBottom = obj.top + Math.round(obj.getScaledHeight());
    const objCenterY = (objTop + objBottom) / 2.0;

    sides.forEach(side => {
        let value;
        let pointArray = [];

        switch (side) {
            case "top":
                value = objTop;
                pointArray = [objLeft, objRight, objCenterX];
                break;
            case "bottom":
                value = objBottom;
                pointArray = [objLeft, objRight, objCenterX];
                break;
            case "centerY":
                value = objCenterY;
                pointArray = [objLeft, objRight, objCenterX];
                break;
            case "left":
                value = objLeft;
                pointArray = [objTop, objBottom, objCenterY];
                break;
            case "right":
                value = objRight;
                pointArray = [objTop, objBottom, objCenterY];
                break;
            case "centerX":
                value = objCenterX;
                pointArray = [objTop, objBottom, objCenterY];
                break;
        }

        for (const target of targets) {            
            const targetLeft = target.left;
            const targetRight = target.left + Math.round(target.getScaledWidth());
            const targetCenterX = (targetLeft + targetRight) / 2.0;

            const targetTop = target.top;
            const targetBottom = target.top + Math.round(target.getScaledHeight());
            const targetCenterY = (targetTop + targetBottom) / 2.0;

            switch (side) {
                case "top":
                case "bottom":
                case "centerY":        
                    if (inRange(value, targetTop) || inRange(value, targetBottom) || inRange(value, targetCenterY)) {
                        pointArray.push(targetLeft);
                        pointArray.push(targetRight);
                        pointArray.push(targetCenterX);
                    }
                    break;
                case "left":
                case "right":
                case "centerX":
                    if (inRange(value, targetLeft) || inRange(value, targetRight) || inRange(value, targetCenterX)) {
                        pointArray.push(targetBottom);
                        pointArray.push(targetTop);
                        pointArray.push(targetCenterY);
                    }
                    break;
            }     


        }

        if (obj.guides[side] instanceof fabric.Line) {
            // remove the line
            canvas.remove(obj.guides[side]);
            delete obj.guides[side];
        }

        if(obj.guidePoints[side] != null){
            obj.guidePoints[side].forEach(mark=>{
                canvas.remove(mark);
            });
            delete obj.guidePoints[side];
        }

        if(pointArray.length <= 3 ) return;

        const sortedPointArray = pointArray.sort((a, b) => a - b);

        let ln;
        const lineProps = {
            evented: true,
            stroke: 'red',
            selectable: false,
            opacity: 1
        };

        let marks = [];

        const markSize = 5;

        switch (side) {
            case "top":
            case "bottom":
            case "centerY":
                ln = new fabric.Line(
                    [sortedPointArray[0], value, sortedPointArray[sortedPointArray.length - 1], value],
                    Object.assign(lineProps, {
                        stroke: 'black'
                    })
                );
                sortedPointArray.forEach(point => {
                    marks.push(new fabric.Line([point - markSize, value - markSize, point + markSize, value + markSize],Object.assign(lineProps, { stroke: 'black' })));
                    marks.push(new fabric.Line([point - markSize, value + markSize, point + markSize, value - markSize],Object.assign(lineProps, { stroke: 'black' })));
                });  
                break;
            case "left":
            case "right":
            case "centerX":
                ln = new fabric.Line(
                    [value, sortedPointArray[0], value, sortedPointArray[sortedPointArray.length - 1]],
                    Object.assign(lineProps, {
                        stroke: 'black'
                    })
                );
                sortedPointArray.forEach(point => {
                    marks.push(new fabric.Line([value - markSize, point - markSize, value + markSize, point + markSize],Object.assign(lineProps, { stroke: 'black' })));
                    marks.push(new fabric.Line([value - markSize, point + markSize, value + markSize, point - markSize],Object.assign(lineProps, { stroke: 'black' })));
                });
                break;
        }

        obj.guides[side] = ln;
        obj.guidePoints[side] = marks;

        canvas.add(ln);  
        marks.forEach(mark => {canvas.add(mark);});
        canvas.renderAll();
    });
}

init();
