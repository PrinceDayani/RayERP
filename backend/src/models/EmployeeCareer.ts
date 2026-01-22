import mongoose, { Document, Schema } from 'mongoose';

export type CareerEventType =
    | 'hire'
    | 'promotion'
    | 'role_change'
    | 'department_change'
    | 'project_start'
    | 'project_end'
    | 'certification'
    | 'achievement';

export interface ICareerEvent {
    date: Date;
    type: CareerEventType;
    title: string;
    description: string;
    metadata?: {
        from?: string;
        to?: string;
        project?: mongoose.Types.ObjectId;
        role?: string;
        department?: string;
    };
    createdBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
}

export interface IEmployeeCareer extends Document {
    employee: mongoose.Types.ObjectId;
    events: mongoose.Types.DocumentArray<ICareerEvent>;
    currentPosition: string;
    currentDepartment: string;
    hireDate: Date;
    promotions: number;
    roleChanges: number;
    departmentChanges: number;
    createdAt: Date;
    updatedAt: Date;

    // Instance methods
    addEvent(event: Partial<ICareerEvent>): Promise<this>;
    getEventsByType(type: CareerEventType): ICareerEvent[];
    getRecentEvents(limit?: number): ICareerEvent[];
}

const careerEventSchema = new Schema<ICareerEvent>({
    date: { type: Date, required: true },
    type: {
        type: String,
        enum: ['hire', 'promotion', 'role_change', 'department_change', 'project_start', 'project_end', 'certification', 'achievement'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    metadata: {
        from: String,
        to: String,
        project: { type: Schema.Types.ObjectId, ref: 'Project' },
        role: String,
        department: String
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const employeeCareerSchema = new Schema<IEmployeeCareer>({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        unique: true
    },
    events: [careerEventSchema],
    currentPosition: { type: String, required: true },
    currentDepartment: { type: String, required: true },
    hireDate: { type: Date, required: true },
    promotions: { type: Number, default: 0 },
    roleChanges: { type: Number, default: 0 },
    departmentChanges: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for performance
employeeCareerSchema.index({ employee: 1 });
employeeCareerSchema.index({ 'events.date': -1 });
employeeCareerSchema.index({ 'events.type': 1 });

// Methods
employeeCareerSchema.methods.addEvent = function (event: Partial<ICareerEvent>) {
    this.events.push(event);

    // Update counters based on event type
    if (event.type === 'promotion') {
        this.promotions += 1;
    } else if (event.type === 'role_change') {
        this.roleChanges += 1;
    } else if (event.type === 'department_change') {
        this.departmentChanges += 1;
    }

    return this.save();
};

employeeCareerSchema.methods.getEventsByType = function (type: CareerEventType) {
    return this.events.filter(event => event.type === type);
};

employeeCareerSchema.methods.getRecentEvents = function (limit: number = 10) {
    return this.events
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
};

export default mongoose.model<IEmployeeCareer>('EmployeeCareer', employeeCareerSchema);
