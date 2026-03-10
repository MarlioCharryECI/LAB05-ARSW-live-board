// utils/validation.js
export class DataValidator {
  static validateStroke(stroke) {
    const errors = [];

    if (!stroke.id || typeof stroke.id !== "string") {
      errors.push("Invalid or missing stroke id");
    }

    if (!stroke.userId || typeof stroke.userId !== "string") {
      errors.push("Invalid or missing userId");
    }

    if (!stroke.color || !/^#[0-9A-F]{6}$/i.test(stroke.color)) {
      errors.push("Invalid color format");
    }

    if (!Array.isArray(stroke.points) || stroke.points.length === 0) {
      errors.push("Invalid or empty points array");
    } else {
      stroke.points.forEach((point, index) => {
        if (!this.validatePoint(point)) {
          errors.push(`Invalid point at index ${index}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validatePoint(point) {
    return (
      point &&
      typeof point.x === "number" &&
      typeof point.y === "number" &&
      point.x >= 0 &&
      point.y >= 0 &&
      typeof point.t === "number"
    );
  }

  static sanitizeStroke(stroke) {
    return {
      id: String(stroke.id || crypto.randomUUID()),
      userId: String(stroke.userId || "unknown"),
      color: this.sanitizeColor(stroke.color),
      width: Math.max(1, Math.min(50, Number(stroke.width) || 4)),
      points: stroke.points.filter((p) => this.validatePoint(p)),
    };
  }

  static sanitizeColor(color) {
    if (!color) return "#000000";
    const hex = color.replace("#", "");
    if (/^[0-9A-F]{6}$/i.test(hex)) {
      return `#${hex}`;
    }
    return "#000000";
  }
}
