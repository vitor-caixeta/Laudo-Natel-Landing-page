import { newsResponse } from '../worker/api.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' }
      });
    }

    const response = await newsResponse();
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: response.status,
        headers: response.headers
      });
    }
    return response;
  }
};
