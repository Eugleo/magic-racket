
export function mapAsync<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
    return Promise.all(array.map(callbackfn));
}

export async function filterAsync<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]> {
    const filterMap = await mapAsync(array, callbackfn);
    return array.filter((value, index) => filterMap[index]);
}

export function flatten<T>(array: T[][]): T[] {
    return array.reduce((a, b) => a.concat(b), []);
}

export function getOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: () => V): V {
    const value = map.get(key);
    if (value) {
        return value;
    }
    const def = getDefault();
    map.set(key, def);
    return def;
}

export async function asyncGetOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: () => Promise<V>): Promise<V> {
    const value = map.get(key);
    if (value) {
        return Promise.resolve(value);
    }
    const def = await getDefault();
    map.set(key, def);
    return def;
}
