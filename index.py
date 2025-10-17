from api.index import app

# This is the main entry point for Vercel
def handler(request):
    return app(request.environ, lambda *args: None)
