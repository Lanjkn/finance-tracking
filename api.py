from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development only)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# MongoDB connection
client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
db = client["finance_db"]
collection = db["gastos"]
renda_collection = db["renda"]

class Gasto(BaseModel):
    nome: str
    tipo: str
    valor: float
    recorrente: Optional[bool] = None

class Renda(BaseModel):
    valor: float

@app.post("/adicionar_renda")
def adicionar_renda(renda: Renda):
    """
    Adiciona um valor de renda ao banco de dados.
    """
    try:
        result = renda_collection.insert_one(renda.dict())
        return {"mensagem": "Renda adicionada com sucesso!", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/listar_todas_as_rendas", response_model=List[dict])
def listar_todas_as_rendas():
    """
    Lista todas as rendas registradas no banco de dados.
    """
    try:
        rendas = list(renda_collection.find({}))
        for renda in rendas:
            renda["_id"] = str(renda["_id"])
        return rendas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/deletar_renda/{renda_id}")
def deletar_renda(renda_id: str):
    """
    Deleta uma renda específica pelo ID.
    """
    try:
        result = renda_collection.delete_one({"_id": ObjectId(renda_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Renda não encontrada")
        return {"mensagem": "Renda removida com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/receber_todos_os_gastos", response_model=List[dict])
def receber_todos_os_gastos():
    try:
        gastos = list(collection.find({}))
        for gasto in gastos:
            gasto["_id"] = str(gasto["_id"])
        return gastos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adicionar_gastos_recorrentes")
def adicionar_gastos_recorrentes(gasto: Gasto):
    try:
        data = gasto.dict()
        data["recorrente"] = True
        result = collection.insert_one(data)
        return {"mensagem": "Gasto recorrente adicionado com sucesso!", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adicionar_gastos_singulares")
def adicionar_gastos_singulares(gasto: Gasto):
    try:
        data = gasto.dict()
        data["recorrente"] = False
        result = collection.insert_one(data)
        return {"mensagem": "Gasto singular adicionado com sucesso!", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/remover_gasto/{gasto_id}")
def remover_gasto(gasto_id: str):
    try:
        result = collection.delete_one({"_id": ObjectId(gasto_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Gasto não encontrado")
        return {"mensagem": "Gasto removido com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/receber_gastos_recorrentes", response_model=List[dict])
def receber_gastos_recorrentes():
    try:
        gastos = list(collection.find({"recorrente": True}))
        for gasto in gastos:
            gasto["_id"] = str(gasto["_id"])
        return gastos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/receber_gastos_singulares", response_model=List[dict])
def receber_gastos_singulares():
    try:
        gastos = list(collection.find({"recorrente": False}))
        for gasto in gastos:
            gasto["_id"] = str(gasto["_id"])
        return gastos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/receber_gastos_totais")
def receber_gastos_totais():
    """
    Calculates the total gastos and subtracts it from the total renda.
    Returns:
        dict: A dictionary containing the total gastos and the remaining amount (renda - gastos).
              Returns 0 if there is no renda.
    """
    try:
        # Get all gastos
        gastos = list(collection.find({}))
        total_gastos = sum(gasto["valor"] for gasto in gastos)

        # Get all renda
        renda_data = list(renda_collection.find({}))
        total_renda = sum(renda["valor"] for renda in renda_data) if renda_data else 0  # Handle empty renda

        resultado = total_renda - total_gastos

        return {
            "total_gastos": total_gastos,
            "resultado": resultado,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)