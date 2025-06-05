import mongoose from 'mongoose'

export class ConnectMongoDB {
    private static instance: ConnectMongoDB;
    private isConnected: boolean = false;

    private constructor() {
    }

    public static getInstance(): ConnectMongoDB {
        if (!ConnectMongoDB.instance) {
            ConnectMongoDB.instance = new ConnectMongoDB();
        }
        return ConnectMongoDB.instance;
    }

    public async connect(uri: string): Promise<void> {
        if (this.isConnected) {
            console.log('Database already connected');
            return;
        }

        try {
            await mongoose.connect(uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            });

            this.isConnected = true;
            console.log('MongoDB connected successfully');

            this.setupEventHandlers();

        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            console.log('Database already disconnected');
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('MongoDB disconnected successfully');
        } catch (error) {
            console.error('MongoDB disconnection error:', error);
            throw error;
        }
    }

    private setupEventHandlers(): void {
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (error) => {
            console.error('Mongoose connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB');
            this.isConnected = false;
        });

        process.on('SIGINT', async () => {
            console.log('Received SIGINT, closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM, closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });
    }
}
