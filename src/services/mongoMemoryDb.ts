import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const startMongoMemoryServer = async () => {
  const uri = process.env.MONGODB_URI || '';
  const isLocal = uri.includes('localhost:27017') || uri.includes('127.0.0.1:27017');
  
  if (process.env.NODE_ENV !== 'production' && isLocal) {
    console.log('⚡ Checking/Starting In-Memory MongoDB Server...');
    try {
      mongod = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: 'infotact',
        },
      });
      console.log(`✅ In-Memory MongoDB Server started on port 27017 (URI: ${mongod.getUri()})`);
    } catch (err: any) {
      if (err.message && err.message.includes('EADDRINUSE')) {
        console.log('ℹ️ Port 27017 is already in use. Assuming local MongoDB is already running.');
      } else {
        console.warn('⚠️ Could not start In-Memory MongoDB Server:', err);
      }
    }
  }
};

export const stopMongoMemoryServer = async () => {
  if (mongod) {
    await mongod.stop();
    console.log('🛑 In-Memory MongoDB Server stopped');
  }
};
