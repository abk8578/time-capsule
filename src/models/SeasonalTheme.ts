import mongoose, { Schema, Model } from "mongoose";
import type { ISeasonalTheme } from "@/types";

const SeasonalThemeSchema = new Schema<ISeasonalTheme>(
  {
    auto: {
      type: Boolean,
      default: true,
      required: true,
    },
    season: {
      type: String,
      enum: ["default", "halloween", "diwali", "christmas"],
      default: "default",
      required: true,
    },
    theme: {
      type: String,
      enum: ["default", "halloween", "diwali", "christmas"],
      default: "default",
    },
    intensity: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
      required: true,
    },
    singletonKey: {
      type: String,
      default: "active_seasonal_theme",
      unique: true,
      index: true,
      required: true,
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save hook to ensure season and theme mirror each other
SeasonalThemeSchema.pre("save", function () {
  if (this.season && !this.theme) {
    this.theme = this.season;
  } else if (this.theme && !this.season) {
    this.season = this.theme;
  }
});

const SeasonalTheme: Model<ISeasonalTheme> =
  (mongoose.models.SeasonalTheme as Model<ISeasonalTheme>) ||
  mongoose.model<ISeasonalTheme>("SeasonalTheme", SeasonalThemeSchema);

export default SeasonalTheme;
