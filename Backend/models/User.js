import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
const plugin = passportLocalMongoose.default || passportLocalMongoose;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    }
});

userSchema.plugin(plugin);

export default mongoose.model("User", userSchema);
