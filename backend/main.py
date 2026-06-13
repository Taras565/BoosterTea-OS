import httpx
from fastapi import Body

# Додаємо ендпоінт автономного ШІ-Агента без лімітів
@app.post("/api/agent/build")
async def alhimik_agent_build(payload: dict = Body(...)):
    import os
    
    api_base = "https://openrouter.ai/api/v1"
    # Твій залізобетонний ключ OpenRouter
    api_key = "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"
    model_name = "qwen/qwen-2.5-coder-32b-instruct:free"
    
    prompt = payload.get("prompt", "")
    target_file = payload.get("file_path", "src/components/AgentComponent.tsx")
    
    system_instruction = (
        "You are an expert AI software engineer. Generate ONLY pure, production-ready code. "
        "Do not include markdown code blocks, do not include explanations."
    )
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{api_base}/chat/completions", json=data, headers=headers)
        result = response.json()
        
    generated_code = result['choices'][0]['message']['content']
    
    os.makedirs(os.path.dirname(target_file), exist_ok=True)
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(generated_code)
        
    return {"status": "success", "file_written": target_file}