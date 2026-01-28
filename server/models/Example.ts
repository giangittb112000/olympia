import mongoose from 'mongoose';

const ExampleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this example.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for this example.'],
  },
});

export default mongoose.models.Example || mongoose.model('Example', ExampleSchema);
