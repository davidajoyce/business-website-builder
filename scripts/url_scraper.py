#!/usr/bin/env python3
"""
Firecrawl API CLI Tool

This script provides CLI access to Firecrawl API for:
1. Scraping URLs to get markdown content
2. Taking screenshots of web pages
3. Getting both markdown and screenshots in one request

It loads the API key from environment variables and makes authenticated requests.
"""

import os
import json
import requests
import argparse
import sys
import base64
from dotenv import load_dotenv
from typing import Dict, Optional
from datetime import datetime


def load_api_key() -> str:
    """Load the Firecrawl API key from environment variables."""
    load_dotenv()
    api_key = os.getenv('FIRECRAWL_API_KEY')
    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY not found in environment variables")
    return api_key


def scrape_url(url: str, api_key: str, only_main_content: bool = False, 
               max_age: int = 172800000, wait_for: int = 5, 
               formats: list = None) -> Dict:
    """
    Scrape a URL using Firecrawl API.
    
    Args:
        url: The URL to scrape
        api_key: The Firecrawl API key
        only_main_content: Whether to extract only main content
        max_age: Maximum age of cached content in milliseconds
        wait_for: Time to wait for page load in seconds
        formats: List of formats to extract (markdown, screenshot, etc.)
        
    Returns:
        Dictionary containing the API response with scraped content
    """
    firecrawl_url = "https://api.firecrawl.dev/v2/scrape"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    if formats is None:
        formats = ["markdown"]
    
    payload = {
        "url": url,
        "onlyMainContent": only_main_content,
        "maxAge": max_age,
        "parsers": [],
        "formats": formats,
        "waitFor": wait_for
    }
    
    try:
        response = requests.post(firecrawl_url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error scraping URL: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response content: {e.response.text}")
        raise


def save_screenshot(screenshot_data: str, filename: str) -> None:
    """
    Save screenshot data to a file. Handles both URLs and base64 data.
    
    Args:
        screenshot_data: Either a URL to the screenshot or base64 encoded image data
        filename: Output filename for the screenshot
    """
    try:
        # Check if it's a URL (starts with http/https)
        if screenshot_data.startswith(('http://', 'https://')):
            print(f"Downloading screenshot from URL...")
            response = requests.get(screenshot_data)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✓ Screenshot downloaded and saved to {filename}")
        else:
            # Handle base64 data
            # Remove data URL prefix if present
            if screenshot_data.startswith('data:image'):
                screenshot_data = screenshot_data.split(',')[1]
            
            image_data = base64.b64decode(screenshot_data)
            with open(filename, 'wb') as f:
                f.write(image_data)
            print(f"✓ Screenshot saved to {filename}")
    except Exception as e:
        print(f"Error saving screenshot: {e}")


def display_scrape_results(scrape_data: Dict) -> None:
    """
    Display the scrape results in a formatted way.
    
    Args:
        scrape_data: The response data from the Firecrawl API
    """
    success = scrape_data.get('success', False)
    if not success:
        print("❌ Scraping failed")
        error = scrape_data.get('error', 'Unknown error')
        print(f"Error: {error}")
        return
    
    data = scrape_data.get('data', {})
    url = data.get('url', 'Unknown URL')
    markdown_content = data.get('markdown', '')
    screenshot = data.get('screenshot', '')
    
    print(f"\n{'='*80}")
    print(f"Scraping Results for: {url}")
    print(f"{'='*80}")
    
    if markdown_content:
        print(f"\n📝 Markdown Content ({len(markdown_content)} characters):")
        print("-" * 60)
        # Show first 500 characters of markdown
        preview = markdown_content[:500]
        print(preview)
        if len(markdown_content) > 500:
            print(f"\n... ({len(markdown_content) - 500} more characters)")
        print("-" * 60)
    
    if screenshot:
        print(f"\n📸 Screenshot: Available ({len(screenshot)} characters of base64 data)")
    
    # Show metadata if available
    metadata = data.get('metadata', {})
    if metadata:
        print(f"\n📊 Metadata:")
        print(f"  Title: {metadata.get('title', 'N/A')}")
        print(f"  Description: {metadata.get('description', 'N/A')}")
        print(f"  Language: {metadata.get('language', 'N/A')}")


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Firecrawl API CLI Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape URL for both markdown and screenshot (default behavior)
  python url_scraper.py "https://www.example.com"
  
  # Scrape URL for markdown content only
  python url_scraper.py "https://www.example.com" --markdown-only
  
  # Scrape URL with screenshot only
  python url_scraper.py "https://www.example.com" --screenshot-only
  
  # Scrape with custom wait time
  python url_scraper.py "https://www.example.com" --wait-for 10
  
  # Scrape without saving files
  python url_scraper.py "https://www.example.com" --no-save
        """
    )
    
    parser.add_argument('url', help='URL to scrape')
    parser.add_argument('--markdown-only', action='store_true', 
                       help='Extract only markdown content (no screenshot)')
    parser.add_argument('--screenshot-only', action='store_true', 
                       help='Take only a screenshot (no markdown)')
    parser.add_argument('--only-main-content', action='store_true',
                       help='Extract only main content (skip ads, navigation, etc.)')
    parser.add_argument('--wait-for', type=int, default=5,
                       help='Time to wait for page load in seconds (default: 5)')
    parser.add_argument('--max-age', type=int, default=172800000,
                       help='Maximum age of cached content in milliseconds (default: 172800000)')
    parser.add_argument('--no-save', action='store_true', 
                       help='Do not save results to files (default: save to files/<url>/ directory)')
    parser.add_argument('--output-dir', default='files',
                       help='Base directory to save output files (default: files)')
    
    return parser.parse_args()


def main():
    """Main function to run the CLI tool."""
    args = parse_arguments()
    
    try:
        # Load API key from environment
        api_key = load_api_key()
        print("✓ API key loaded successfully")
        
        # Determine formats based on arguments
        formats = []
        
        # Default behavior: both markdown and screenshot
        if args.markdown_only:
            formats = ["markdown"]
        elif args.screenshot_only:
            formats = [{
                "type": "screenshot",
                "fullPage": True
            }]
        else:
            # Default: both markdown and screenshot
            formats = [
                "markdown",
                {
                    "type": "screenshot",
                    "fullPage": True
                }
            ]
        
        print(f"Scraping URL: {args.url}")
        print(f"Formats: {[f if isinstance(f, str) else f['type'] for f in formats]}")
        
        scrape_data = scrape_url(
            url=args.url,
            api_key=api_key,
            only_main_content=args.only_main_content,
            max_age=args.max_age,
            wait_for=args.wait_for,
            formats=formats
        )
        
        display_scrape_results(scrape_data)
        
        # Save files unless --no-save is specified
        if not args.no_save:
            # Create URL-safe directory name
            url_safe = args.url.replace('https://', '').replace('http://', '').replace('/', '_').replace('.', '_').replace(':', '_')
            url_dir = os.path.join(args.output_dir, url_safe)
            os.makedirs(url_dir, exist_ok=True)
            
            data = scrape_data.get('data', {})
            
            # Save markdown if available
            if 'markdown' in formats and data.get('markdown'):
                markdown_filename = os.path.join(url_dir, "content.md")
                with open(markdown_filename, 'w', encoding='utf-8') as f:
                    f.write(data['markdown'])
                print(f"✓ Markdown saved to {markdown_filename}")
            
            # Save screenshot if available
            if any(isinstance(f, dict) and f.get('type') == 'screenshot' for f in formats) and data.get('screenshot'):
                screenshot_filename = os.path.join(url_dir, "content.png")
                save_screenshot(data['screenshot'], screenshot_filename)
            
            # Save full JSON response
            json_filename = os.path.join(url_dir, "response.json")
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(scrape_data, f, indent=2, ensure_ascii=False)
            print(f"✓ Full response saved to {json_filename}")
        
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please make sure you have FIRECRAWL_API_KEY in your .env file")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
