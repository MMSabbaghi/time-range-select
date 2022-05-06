const defaults = {
  start: 9,
  end: 17,
  step: 15,
  width: 300,
  height: 300,
  step_mins: 15,
  on_change: () => {},
};

function polar_to_cartesian(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180.0;
  return [
    Math.round((cx + radius * Math.cos(radians)) * 100) / 100,
    Math.round((cy + radius * Math.sin(radians)) * 100) / 100,
  ];
}

function svg_arc_path(x, y, radius, range) {
  const start_xy = polar_to_cartesian(x, y, radius, range[1]);
  const end_xy = polar_to_cartesian(x, y, radius, range[0]);
  const long = range[1] - range[0] >= 180 ? 1 : 0;
  return [
    "M",
    start_xy[0],
    start_xy[1],
    "A",
    radius,
    radius,
    0,
    long,
    0,
    end_xy[0],
    end_xy[1],
  ].join(" ");
}

function angle_from_point(width, height, x, y) {
  return (-Math.atan2(width / 2 - x, height / 2 - y) * 180) / Math.PI;
}

function time_to_angle(time) {
  return ((time - 6) * 360) / 12 - 180;
}

function timerange_to_angle(timeRange) {
  return [time_to_angle(timeRange[0]), time_to_angle(timeRange[1])];
}

function angle_to_time(angle, step_mins) {
  return (
    6 +
    Math.floor((((180 + angle) * 12) / 360) * (60 / step_mins)) /
      (60 / step_mins)
  );
}

class TimeRangeSelect {
  constructor(options) {
    this.options = { ...defaults, ...options };
    this.container = document.querySelector(options.container);
    this.path = document.querySelector(".circle-datepicker__path");
    this.start = document.querySelector(".circle-datepicker__start");
    this.end = document.querySelector(".circle-datepicker__end");
    this.value = timerange_to_angle([this.options.start, this.options.end]);
    this.pressed = null;
    this.oldValues = [];
    this.angle;
    this.init();
  }

  init() {
    this.draw();

    ["path", "start", "end"].forEach((el) => {
      this[el].addEventListener("mousedown", (e) => this.elMouseDown(e, el));
    });

    document.addEventListener("mousemove", this.docMouseMove.bind(this));
    document.addEventListener("mouseup", () => (this.pressed = null));
  }

  getOffset() {
    return {
      left: this.container.offsetLeft,
      top: this.container.offsetTop,
    };
  }

  elMouseDown(e, el) {
    const offset = this.getOffset();
    this.angle = angle_from_point(
      this.options.width,
      this.options.height,
      e.pageX - offset.left,
      e.pageY - offset.top
    );
    this.oldValues = [this.value[0], this.value[1]];
    this.pressed = el;
  }

  docMouseMove(e) {
    if (this.pressed) {
      const offset = this.getOffset();
      let diff =
        this.angle -
        angle_from_point(
          this.options.width,
          this.options.height,
          e.pageX - offset.left,
          e.pageY - offset.top
        );

      switch (this.pressed) {
        case "path": {
          this.value = [this.oldValues[0] - diff, this.oldValues[1] - diff];
          break;
        }
        case "start": {
          if (this.oldValues[0] - diff > this.oldValues[1]) diff = diff + 360;
          this.value[0] = this.oldValues[0] - diff;
          break;
        }
        case "end": {
          if (this.oldValues[1] - diff < this.oldValues[0]) diff = diff - 360;
          this.value[1] = this.oldValues[1] - diff;
          break;
        }
        default:
          break;
      }

      this.value[0] = this.value[0] % 360;
      this.value[1] = this.value[1] % 360;

      requestAnimationFrame(() => {
        this.draw();
        this.handleChange();
      });
    }
  }

  drawCircle(el, angle) {
    el.setAttribute("cx", polar_to_cartesian(150, 150, 100, angle)[0]);
    el.setAttribute("cy", polar_to_cartesian(150, 150, 100, angle)[1]);
  }

  draw() {
    this.path.setAttribute("d", svg_arc_path(150, 150, 100, this.value));
    this.drawCircle(this.start, this.value[0]);
    this.drawCircle(this.end, this.value[1]);
  }

  handleChange() {
    const values = {
      start: angle_to_time(this.value[0], this.options.step_mins),
      end: angle_to_time(this.value[1], this.options.step_mins),
    };
    this.options.on_change(values);
  }
}
