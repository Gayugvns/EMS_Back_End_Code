// models/Department.js
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add department name'],
        unique: true,
        trim: true,
        maxlength: [100, 'Department name cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    location: {
        type: String,
        trim: true
    },
    employeeCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp
DepartmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Auto-increment employee count when employees are added
DepartmentSchema.statics.incrementEmployeeCount = async function(departmentId) {
    return await this.findByIdAndUpdate(
        departmentId,
        { $inc: { employeeCount: 1 } },
        { new: true }
    );
};

// Auto-decrement employee count when employees are removed
DepartmentSchema.statics.decrementEmployeeCount = async function(departmentId) {
    return await this.findByIdAndUpdate(
        departmentId,
        { $inc: { employeeCount: -1 } },
        { new: true }
    );
};

module.exports = mongoose.model('Department', DepartmentSchema);