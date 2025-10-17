import requests
import time
import json
import os
from urllib.parse import urlparse

USER_ID = "5f9T1QuvWvbnkogeUqfk7lmUpsm1"
SAVED_ITEM_ID = "ujef8PYUuWgAtDcYR43aNF"
API_KEY = "1facf19033a348ffb0724746338ef0cb"

FOCUS_AREA = "Content Optimization (Hero, Services, Header, Meta, FAQ, CTAs, etc.)"


def get_url_directory_name(url: str):
    """Extract a clean directory name from URL"""
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '')
    # Replace dots and other special chars with underscores
    clean_domain = domain.replace('.', '_').replace('-', '_')
    return clean_domain


def create_url_directory(url: str):
    """Create directory structure: files/<domain>/"""
    domain_dir = get_url_directory_name(url)
    files_dir = os.path.join("files", domain_dir)
    os.makedirs(files_dir, exist_ok=True)
    return files_dir


def save_results_to_files(result: dict, url: str):
    """Save both JSON results and markdown content to organized file structure"""
    files_dir = create_url_directory(url)
    
    # Save JSON results
    json_path = os.path.join(files_dir, "result.json")
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"💾 JSON results saved to: {json_path}")
    except Exception as e:
        print(f"❌ Error saving JSON file: {e}")
    
    # Save markdown content if available
    outputs = result.get("outputs", {})
    markdown_content = outputs.get("output", "")
    
    if markdown_content and (markdown_content.strip().startswith('#') or '##' in markdown_content):
        md_path = os.path.join(files_dir, "content.md")
        try:
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            print(f"💾 Markdown content saved to: {md_path}")
        except Exception as e:
            print(f"❌ Error saving markdown file: {e}")
    else:
        print("⚠️  No markdown content found to save")


def start_pipeline(url: str):
    url = f"https://api.gumloop.com/api/v1/start_pipeline?user_id={USER_ID}&saved_item_id={SAVED_ITEM_ID}"
    payload = {"url":url, "focus_area":FOCUS_AREA}
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    response = requests.request("POST", url, json=payload, headers=headers)
    return response.json()


def get_run_result(run_id: str):
    url = f"https://api.gumloop.com/api/v1/get_pl_run?user_id={USER_ID}&run_id={run_id}"
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    response = requests.request("GET", url, headers=headers)
    return response.json()


def poll_job_status(run_id: str, poll_interval: int = 2, url: str = None):
    """
    Poll job status every poll_interval seconds until completion.
    Pretty prints the output when the job is done.
    If url is provided, saves results to organized file structure.
    """
    print(f"Polling job status for run_id: {run_id}")
    print(f"Checking every {poll_interval} seconds...")
    print("-" * 50)
    
    while True:
        try:
            result = get_run_result(run_id)
            state = result.get("state", "UNKNOWN")
            
            print(f"[{time.strftime('%H:%M:%S')}] Job state: {state}")
            
            if state == "DONE":
                print("\n" + "="*60)
                print("JOB COMPLETED SUCCESSFULLY!")
                print("="*60)
                
                # Save results to organized file structure if URL is provided
                if url:
                    print("\n💾 Saving results to organized file structure...")
                    save_results_to_files(result, url)
                
                outputs = result.get("outputs", {})
                if outputs:
                    print("\n📊 OUTPUTS:")
                    print("-" * 30)
                    for key, value in outputs.items():
                        print(f"\n🔑 {key}:")
                        if isinstance(value, str):
                            # Pretty print string output
                            print(value)
                        else:
                            # Pretty print JSON output
                            print(json.dumps(value, indent=2))
                else:
                    print("\n⚠️  No outputs found in the result")
                
                # Also show some job statistics
                print(f"\n📈 JOB STATISTICS:")
                print(f"   • Credit Cost: {result.get('credit_cost', 'N/A')}")
                print(f"   • Child Run Credit Cost: {result.get('child_run_credit_cost', 'N/A')}")
                print(f"   • Node Executions: {result.get('node_executions', 'N/A')}")
                print(f"   • Created: {result.get('created_ts', 'N/A')}")
                print(f"   • Finished: {result.get('finished_ts', 'N/A')}")
                
                break
                
            elif state == "FAILED":
                print("\n" + "="*60)
                print("❌ JOB FAILED!")
                print("="*60)
                print(f"Error details: {result}")
                break
                
            elif state == "RUNNING":
                # Show progress from logs if available
                logs = result.get("log", [])
                if logs:
                    recent_logs = logs[-3:]  # Show last 3 log entries
                    print("   Recent activity:")
                    for log_entry in recent_logs:
                        # Clean up ANSI escape codes for better readability
                        clean_log = log_entry.replace('\x1b[34m', '').replace('\x1b[32m', '').replace('\x1b[0m', '')
                        if '__system__:' in clean_log:
                            continue  # Skip system logs
                        print(f"     • {clean_log}")
                
            else:
                print(f"   Unknown state: {state}")
            
            time.sleep(poll_interval)
            
        except KeyboardInterrupt:
            print("\n\n⏹️  Polling interrupted by user")
            break
        except Exception as e:
            print(f"\n❌ Error polling job status: {e}")
            time.sleep(poll_interval)


def save_markdown_output(run_id: str, output_content: str = None, url: str = None):
    """
    Save markdown output from a completed job to a file.
    If output_content is not provided, fetches the latest result.
    If url is provided, saves to organized file structure.
    """
    if output_content is None:
        result = get_run_result(run_id)
        outputs = result.get("outputs", {})
        output_content = outputs.get("output", "")
    
    if not output_content or not (output_content.strip().startswith('#') or '##' in output_content):
        print("❌ No markdown content found in outputs")
        return None
    
    if url:
        # Use organized file structure
        files_dir = create_url_directory(url)
        filename = os.path.join(files_dir, "content.md")
    else:
        # Use simple filename
        filename = f"{run_id}.md"
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(output_content)
        print(f"💾 Markdown report saved to: {filename}")
        return filename
    except Exception as e:
        print(f"❌ Error saving markdown file: {e}")
        return None


import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description='SEO Pipeline CLI')
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 'run' command to start pipeline with url
    run_parser = subparsers.add_parser('run', help='Start pipeline with a URL')
    run_parser.add_argument('url', type=str, help='URL to process')
    run_parser.add_argument('--poll', action='store_true', help='Automatically poll for results after starting')

    # 'results' command to get results with run id
    results_parser = subparsers.add_parser('results', help='Get results for a given run ID')
    results_parser.add_argument('run_id', type=str, help='Run ID to fetch results for')

    # 'poll' command to poll job status
    poll_parser = subparsers.add_parser('poll', help='Poll job status until completion')
    poll_parser.add_argument('run_id', type=str, help='Run ID to poll')
    poll_parser.add_argument('--interval', type=int, default=2, help='Polling interval in seconds (default: 2)')
    poll_parser.add_argument('--url', type=str, help='URL to organize files by domain')

    # 'save' command to save markdown output
    save_parser = subparsers.add_parser('save', help='Save markdown output from completed job')
    save_parser.add_argument('run_id', type=str, help='Run ID to save output for')
    save_parser.add_argument('--url', type=str, help='URL to organize files by domain')

    args = parser.parse_args()

    if args.command == 'run':
        result = start_pipeline(args.url)
        run_id = result.get("run_id")
        if run_id:
            print(f"Pipeline started with run_id: {run_id}")
            if args.poll:
                print("\nStarting automatic polling...")
                poll_job_status(run_id, url=args.url)
            else:
                print(f"Use 'python seo.py poll {run_id} --url {args.url}' to monitor progress")
        else:
            print("Failed to retrieve run_id. Response:", result)
            sys.exit(1)
    elif args.command == 'results':
        result = get_run_result(args.run_id)
        print(result)
    elif args.command == 'poll':
        poll_job_status(args.run_id, args.interval, args.url)
    elif args.command == 'save':
        save_markdown_output(args.run_id, url=args.url)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()



# url = f"https://api.gumloop.com/api/v1/start_pipeline?user_id={USER_ID}&saved_item_id={SAVED_ITEM_ID}"
# payload = {"URL":"https://www.vipcarcare.com.au"}
# headers = {
# "Content-Type": "application/json",
# "Authorization": f"Bearer {API_KEY}"
# }
# response = requests.request("POST", url, json=payload, headers=headers)
# result = response.json()


# url = "https://api.gumloop.com/api/v1/get_pl_run"
# params = {
#     "run_id": result["run_id"],
#     "user_id": USER_ID
# }
# headers = {
#     "Authorization": f"Bearer {API_KEY}"
# }

# response = requests.get(url, params=params, headers=headers)
# result = response.json()

# print(result)