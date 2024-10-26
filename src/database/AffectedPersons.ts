import mongoose, { Schema, Document } from "mongoose";


interface IAffectedPerson extends Document {
  name: string;
  location: string;
  symptoms: string; 
}

// Create the schema for affected persons
const affectedPersonSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  symptoms: { type: String, required: false },
});

// Create the model
 export const AffectedPerson = mongoose.model<IAffectedPerson>("AffectedPerson", affectedPersonSchema);
