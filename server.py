import os
import re
import sys
import http.server
import socketserver

class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        """Common code for GET and HEAD commands to support HTTP Range requests."""
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            parts = os.path.split(path)
            if parts[-1] == '':
                # Redirect browser entries to directory with trailing slash
                self.send_response(http.HTTPStatus.MOVED_PERMANENTLY)
                new_parts = list(parts)
                new_parts[-1] = ''
                new_path = '/'.join(new_parts) + '/'
                self.send_header("Location", new_path)
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                return super().send_head()
        
        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(http.HTTPStatus.NOT_FOUND, "File not found")
            return None

        # Handle Range Header
        range_header = self.headers.get('Range')
        if range_header:
            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                start = int(match.group(1))
                end = match.group(2)
                try:
                    size = os.path.getsize(path)
                except OSError:
                    self.send_error(http.HTTPStatus.NOT_FOUND, "File not found")
                    f.close()
                    return None
                
                if end:
                    end = int(end)
                else:
                    end = size - 1
                
                if start >= size:
                    self.send_error(http.HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    f.close()
                    return None
                
                if end >= size:
                    end = size - 1
                
                length = end - start + 1
                f.seek(start)
                
                self.send_response(http.HTTPStatus.PARTIAL_CONTENT)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                return f

        # If no Range header, proceed normally
        try:
            size = os.path.getsize(path)
            self.send_response(http.HTTPStatus.OK)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

if __name__ == "__main__":
    # Standard port 8000
    PORT = 8000
    # Allow address reuse
    socketserver.TCPServer.allow_reuse_address = True
    handler = RangeRequestHandler
    
    # Change current working directory to directory of the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving Portfolio with Range Requests at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)
