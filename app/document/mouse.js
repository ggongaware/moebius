const events = require("events");
const buttons = {NONE: 0, LEFT: 1, RIGHT: 2};

class MouseListener extends events.EventEmitter {
    set_dimensions(columns, rows, font) {
        this.columns = columns;
        this.rows = rows;
        this.font = font;
    }

    get_xy(event) {
        const canvas_container = document.getElementById("canvas_container");
        const canvas_container_rect = canvas_container.getBoundingClientRect();
        const x = Math.min(Math.max(Math.floor((event.clientX - canvas_container_rect.left) / render.font.width), 0), doc.columns - 1);
        const y = Math.min(Math.max(Math.floor((event.clientY - canvas_container_rect.top) / render.font.height), 0), doc.rows - 1);
        const half_y = Math.min(Math.max(Math.floor((event.clientY - canvas_container_rect.top) / (render.font.height / 2)), 0), doc.rows * 2 - 1);
        return {x, y, half_y};
    }

    record_start(half_block_precision = false) {
        [this.start.x, this.start.y, this.start.half_y] = [this.x, this.y, this.half_y];
        this.started = true;
        this.half_block_precision = half_block_precision;
    }

    start_drawing(half_block_precision = false) {
        this.drawing = true;
        this.half_block_precision = half_block_precision;
    }

    end() {
        this.button = buttons.NONE;
        this.started = false;
        this.drawing = false;
    }

    store(x, y, half_y) {
        [this.x, this.y, this.half_y] = [x, y, half_y];
    }

    mouse_down(event) {
        if (!this.font) return;
        const {x, y, half_y} = this.get_xy(event);
        this.store(x, y, half_y);
        if (event.button == 0) {
            this.button = buttons.LEFT;
        } else if (event.button == 2) {
            this.button = buttons.RIGHT;
        }
        this.emit("down", {x, y, half_y, button: this.button, shift_key: event.shiftKey, alt_key: event.altKey});
        this.last = {x, y, half_y};
    }

    same_as_last(x, y, half_y) {
        if (this.last.x == x && this.last.y == y && (!this.half_block_precision || this.last.half_y == half_y)) return true;
        this.last = {x, y, half_y};
        return false;
    }

    mouse_move(event) {
        if (!this.font) return;
        const {x, y, half_y} = this.get_xy(event);
        if (this.x == x && this.y == y && this.half_y == half_y) return;
        if (this.drawing) {
            if (!this.same_as_last(x, y, half_y)) {
                this.emit("draw", {x, y, half_y, button: this.button, shift_key: event.shiftKey});
                this.store(x, y, half_y);
            }
        } else if (this.started) {
            if (!this.same_as_last(x, y, half_y)) this.emit("to", {x, y, half_y, button: this.button, shift_key: event.shiftKey});
        } else {
            this.emit("move", {x, y, half_y});
        }
    }

    mouse_up(event) {
        if (!this.font) return;
        const {x, y, half_y} = this.get_xy(event);
        if (this.drawing || this.started) {
            this.emit("up", {x, y, half_y, button: mouse.button});
            this.end();
        }
    }

    mouse_out(event) {
        if (event.relatedTarget) return;
        this.end();
    }

    constructor() {
        super();
        this.buttons = buttons;
        this.button = buttons.NONE;
        this.start = {x: 0, y: 0, half_y: 0};
        this.started = false;
        this.drawing = false;
        document.addEventListener("DOMContentLoaded", (event) => {
            document.getElementById("canvas_container").addEventListener("mousedown", (event) => this.mouse_down(event), true);
            document.body.addEventListener("mousemove", (event) => this.mouse_move(event), true);
            document.body.addEventListener("mouseup", (event) => this.mouse_up(event), true);
            document.body.addEventListener("mouseout", (event) => this.mouse_out(event), true);
        });
    }
}

module.exports = new MouseListener();
