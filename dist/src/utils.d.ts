/**
 * General purpose fast hashing function that works in the browser and in node.
 * Credit https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
 **/
export declare const cyrb53: (str: string, seed?: number) => number;
