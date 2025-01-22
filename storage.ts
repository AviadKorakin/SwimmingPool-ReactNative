import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageUtil {
    private static instance: StorageUtil;

    // Private constructor to prevent direct instantiation
    private constructor() {}

    // Static method to get the single instance
    public static getInstance(): StorageUtil {
        if (!StorageUtil.instance) {
            StorageUtil.instance = new StorageUtil();
        }
        return StorageUtil.instance;
    }

    /**
     * Save data to AsyncStorage with a specific key
     * @param key The key to store the data under
     * @param value The value to store (object or string)
     */
    async save<T>(key: string, value: T): Promise<void> {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
            console.log(`Data saved under key: ${key}`);
        } catch (error) {
            console.error(`Failed to save data for key "${key}":`, error);
        }
    }

    /**
     * Fetch data from AsyncStorage by key
     * @param key The key to retrieve the data for
     * @returns The parsed value (if JSON) or string value
     */
    async fetch<T>(key: string): Promise<T | null> {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            if (jsonValue !== null) {
                console.log(`Data fetched for key: ${key}`);
                return JSON.parse(jsonValue) as T;
            }
        } catch (error) {
            console.error(`Failed to fetch data for key "${key}":`, error);
        }
        return null;
    }

    /**
     * Remove data from AsyncStorage by key
     * @param key The key to remove the data for
     */
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
            console.log(`Data removed for key: ${key}`);
        } catch (error) {
            console.error(`Failed to remove data for key "${key}":`, error);
        }
    }

    /**
     * Clear all AsyncStorage data
     */
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.clear();
            console.log('All AsyncStorage data cleared');
        } catch (error) {
            console.error('Failed to clear AsyncStorage:', error);
        }
    }
}

export default StorageUtil.getInstance();
