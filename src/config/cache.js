import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600 }) // 10 minutes

export default cache;