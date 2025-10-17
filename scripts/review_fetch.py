#!/usr/bin/env python3
"""
Google Places API CLI Tool

This script provides CLI access to Google Places API for:
1. Searching for places by text query
2. Fetching reviews for a specific place

It loads the API key from environment variables and makes authenticated requests.
"""

import os
import json
import requests
import argparse
import sys
from dotenv import load_dotenv
from typing import Dict, List, Optional


def load_api_key() -> str:
    """Load the Google Places API key from environment variables."""
    load_dotenv()
    api_key = os.getenv('GOOGLE_PLACES_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_PLACES_API_KEY not found in environment variables")
    return api_key


def search_places(text_query: str, api_key: str) -> Dict:
    """
    Search for places using Google Places API text search.
    
    Args:
        text_query: The text query to search for (e.g., "Starbucks in New York")
        api_key: The Google Places API key
        
    Returns:
        Dictionary containing the API response with search results
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
    }
    
    payload = {
        "textQuery": text_query
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error searching places: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response content: {e.response.text}")
        raise


def fetch_place_reviews(place_id: str, api_key: str) -> Dict:
    """
    Fetch reviews for a specific place using Google Places API.
    
    Args:
        place_id: The Google Places ID for the location
        api_key: The Google Places API key
        
    Returns:
        Dictionary containing the API response with place details and reviews
    """
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': 'id,displayName,reviews'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching reviews: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response content: {e.response.text}")
        raise


def display_search_results(search_data: Dict) -> None:
    """
    Display the search results in a formatted way.
    
    Args:
        search_data: The response data from the Google Places API search
    """
    places = search_data.get('places', [])
    
    if not places:
        print("No places found for your search query.")
        return
    
    print(f"\n{'='*80}")
    print(f"Found {len(places)} place(s) matching your search:")
    print(f"{'='*80}")
    
    for i, place in enumerate(places, 1):
        place_id = place.get('id', 'Unknown ID')
        display_name = place.get('displayName', 'Unknown Name')
        address = place.get('formattedAddress', 'No address available')
        
        print(f"\n{i}. {display_name}")
        print(f"   Place ID: {place_id}")
        print(f"   Address: {address}")
        print("-" * 60)


def display_reviews(place_data: Dict) -> None:
    """
    Display the fetched reviews in a formatted way.
    
    Args:
        place_data: The response data from the Google Places API
    """
    place_name = place_data.get('displayName', 'Unknown Place')
    place_id = place_data.get('id', 'Unknown ID')
    
    print(f"\n{'='*60}")
    print(f"Place: {place_name}")
    print(f"Place ID: {place_id}")
    print(f"{'='*60}")
    
    reviews = place_data.get('reviews', [])
    
    if not reviews:
        print("No reviews found for this place.")
        return
    
    print(f"\nFound {len(reviews)} review(s):\n")
    
    for i, review in enumerate(reviews, 1):
        author = review.get('authorAttribution', {}).get('displayName', 'Anonymous')
        rating = review.get('rating', 'N/A')
        text = review.get('text', {}).get('text', 'No text provided')
        publish_time = review.get('publishTime', 'Unknown date')
        
        print(f"Review #{i}")
        print(f"Author: {author}")
        print(f"Rating: {rating}/5")
        print(f"Date: {publish_time}")
        print(f"Text: {text}")
        print("-" * 40)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Google Places API CLI Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search for places
  python review_fetch.py search "Starbucks in New York"
  python review_fetch.py search "Italian restaurant in San Francisco"
  
  # Fetch reviews for a specific place
  python review_fetch.py reviews ChIJN1t_tDeuEmsRUsoyG83frY4
  python review_fetch.py reviews --place-id ChIJN1t_tDeuEmsRUsoyG83frY4
  
  # Save results to file
  python review_fetch.py search "Coffee shop" --save
  python review_fetch.py reviews ChIJN1t_tDeuEmsRUsoyG83frY4 --save
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search for places')
    search_parser.add_argument('query', help='Text query to search for (e.g., "Starbucks in New York")')
    search_parser.add_argument('--save', action='store_true', help='Save results to JSON file')
    
    # Reviews command
    reviews_parser = subparsers.add_parser('reviews', help='Fetch reviews for a place')
    reviews_parser.add_argument('place_id', help='Google Place ID')
    reviews_parser.add_argument('--save', action='store_true', help='Save results to JSON file')
    
    return parser.parse_args()


def main():
    """Main function to run the CLI tool."""
    args = parse_arguments()
    
    if not args.command:
        print("Error: Please specify a command (search or reviews)")
        print("Use --help for more information")
        sys.exit(1)
    
    try:
        # Load API key from environment
        api_key = load_api_key()
        print("✓ API key loaded successfully")
        
        if args.command == 'search':
            print(f"Searching for: {args.query}")
            search_data = search_places(args.query, api_key)
            display_search_results(search_data)
            
            if args.save:
                filename = f"search_results_{args.query.replace(' ', '_').replace(',', '')}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(search_data, f, indent=2, ensure_ascii=False)
                print(f"✓ Search results saved to {filename}")
        
        elif args.command == 'reviews':
            print(f"Fetching reviews for place ID: {args.place_id}")
            place_data = fetch_place_reviews(args.place_id, api_key)
            display_reviews(place_data)
            
            if args.save:
                place_name = place_data.get('displayName', 'unknown').replace(' ', '_')
                filename = f"reviews_{args.place_id}_{place_name}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(place_data, f, indent=2, ensure_ascii=False)
                print(f"✓ Reviews saved to {filename}")
        
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please make sure you have GOOGLE_PLACES_API_KEY in your .env file")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
