import "./styles.css";
import { fabric } from "fabric";
import "./fabric-smart-object.js";

// initialize fabric canvas and assign to global windows object for debug
var canvas = (window._canvas = new fabric.Canvas("c"));

// ADD YOUR CODE HERE
var events = {
  object: ["added", "moving", "moved", "scaled", "selected", "over"],
  mouse: ["down", "up", "moving", "over", "out"]
};

function bindEvents() {
  canvas.on('mouse:up', onMouseUp);

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

function createRect(left, top, color) {
  var options = {
    originX: "left",
    originY: "top",
    left: left,
    top: top,
    width: 100,
    height: 100
  };

  if (color) {
    options["fill"] = color;
  }

  var rect = new fabric.Rect(options);

  rect.guides = {};

  canvas.add(rect);
  canvas.renderAll();
}

function init() {
  bindEvents();
  createRect(200, 200);
  createRect(
    Math.floor(Math.random() * canvas.width),
    Math.floor(Math.random() * canvas.height),
    "green"
  );
  createRect(
    Math.floor(Math.random() * canvas.width),
    Math.floor(Math.random() * canvas.height),
    "red"
  );
}

function onMouseUp(e) {
  const objects = canvas.getObjects().filter(o => o.type !== "line");

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

function onObjectAdded(e) {
  // Add the smart guides around the object
  const obj = e.target;

  if (!(obj instanceof fabric.Rect)) return false;

  drawObjectGuides(obj);
}

function onObjectMoved(e) {
  // Add the smart guides around the object
  const obj = e.target;

  if (!(obj instanceof fabric.Rect)) return false;

  drawObjectGuides(obj);
}

function onObjectMoving(e) {
  const obj = e.target;

  if (!(obj instanceof fabric.Rect)) return false;

  drawObjectGuides(obj);

  const objects = canvas
    .getObjects()
    .filter((o) => o.type !== "line" && o !== obj);

  const matches = new Set();

  for (var i of objects) {
    for (var side in obj.guides) {
      var axis, newPos;

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
        matches.add(side);
        snapObject(obj, axis, newPos);
      }

      if (side === "left") {
        if (inRange(obj.guides["left"][axis], i.guides["right"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["right"][axis]);
        } else if(inRange(obj.guides["left"][axis], i.guides["centerX"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["centerX"][axis]);
        } 
      } else if (side === "right") {
        if (inRange(obj.guides["right"][axis], i.guides["left"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["left"][axis] - obj.getScaledWidth());
        } else if (inRange(obj.guides["right"][axis], i.guides["centerX"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["centerX"][axis] - obj.getScaledWidth());
        } 
      } else if (side === "top") {
        if (inRange(obj.guides["top"][axis], i.guides["bottom"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["bottom"][axis]);
        } else if (inRange(obj.guides["top"][axis], i.guides["centerY"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["centerY"][axis]);
        }
      } else if (side === "bottom") {
        if (inRange(obj.guides["bottom"][axis], i.guides["top"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["top"][axis] - obj.getScaledHeight());
        } else if (inRange(obj.guides["bottom"][axis], i.guides["centerY"][axis])) {
          matches.add(side);
          snapObject(obj, axis, i.guides["centerY"][axis] - obj.getScaledHeight());
        }
      } else if (side === "centerX") {
        if (inRange(obj.guides["centerX"][axis], i.guides["left"][axis])) {
          matches.add(side);
          snapObject(
            obj,
            axis,
            i.guides["left"][axis] - obj.getScaledWidth() / 2
          );
        } else if (
          inRange(obj.guides["centerX"][axis], i.guides["right"][axis])
        ) {
          matches.add(side);
          snapObject(
            obj,
            axis,
            i.guides["right"][axis] - obj.getScaledWidth() / 2
          );
        }
      } else if (side === "centerY") {
        if (inRange(obj.guides["centerY"][axis], i.guides["top"][axis])) {
          matches.add(side);
          snapObject(
            obj,
            axis,
            i.guides["top"][axis] - obj.getScaledHeight() / 2
          );
        } else if (
          inRange(obj.guides["centerY"][axis], i.guides["bottom"][axis])
        ) {
          matches.add(side);
          snapObject(
            obj,
            axis,
            i.guides["bottom"][axis] - obj.getScaledHeight() / 2
          );
        }
      }
    }
  }

  obj.setCoords();
}

// If the 2 different coordinates are in range
function inRange(a, b) {
  return Math.abs(a - b) <= 10;
}

function snapObject(obj, side, pos) {
  obj.set(side, pos);
  obj.setCoords();
  drawObjectGuides(obj);
}

function drawObjectGuides(obj) {
  const w = obj.getScaledWidth();
  const h = obj.getScaledHeight();
  drawGuide("top",  obj);
  drawGuide("left",obj);
  drawGuide("centerX",  obj);
  drawGuide("centerY", obj);
  drawGuide("right", obj);
  drawGuide("bottom",  obj);
  obj.setCoords();
}

function drawGuide(side, obj) {
  const objects = canvas.getObjects().filter((o) => o.type !== "line" && o !== obj);

  var objLeft = obj.left;
  var objRight = obj.left + obj.getScaledWidth();  
  var objCenterX = (objLeft + objRight) / 2;

  var objTop = obj.top;
  var objBottom = obj.top + obj.getScaledHeight();
  var objCenterY = (objTop + objBottom) / 2;

  var value;
  var pointArray = [];

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

  var minDiff = 100;

  for (var target of objects) {
    var targetLeft = target.left;
    var targetRight = target.left + target.getScaledWidth();
    var targetCenterX = (targetLeft + targetRight) / 2;

    var targetTop = target.top;
    var targetBottom = target.top + target.getScaledHeight();
    var targetCenterY = (targetTop + targetBottom) / 2;
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

  var ln;
  var lineProps = {
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
