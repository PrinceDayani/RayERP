export const config = {
    api: {
      // Disable body parsing, we'll handle it ourselves
      bodyParser: false,
      // Enable responding to all HTTP methods
      externalResolver: true,
    }
  };
  
  export default async function handler(req, res) {
    const pathParts = req.query.path;
    const path = pathParts.join('/');
    
    const backendUrl = process.env.BACKEND_URL;
    const url = `${backendUrl}/api/${path}`;
    
    try {
      // Forward the request to the backend
      const headers = new Headers();
      
      // Copy relevant headers
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key !== 'host' && key !== 'connection') {
          headers.append(key, value);
        }
      });
      
      // Get request body if exists
      let body = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        // Create a buffer from the incoming request
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        body = Buffer.concat(chunks);
      }
      
      // Forward request to backend
      const fetchRes = await fetch(url, {
        method: req.method,
        headers,
        body,
        redirect: 'follow',
      });
      
      // Copy backend response status and headers
      res.status(fetchRes.status);
      for (const [key, value] of fetchRes.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Get response data as buffer
      const responseBuffer = await fetchRes.arrayBuffer();
      const responseData = Buffer.from(responseBuffer);
      
      // Send response
      res.send(responseData);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy request to backend' });
    }
  }