import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [gastos, setGastos] = useState([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [renda, setRenda] = useState("");
  const [isRendaFormOpen, setIsRendaFormOpen] = useState(true);
  const [totalData, setTotalData] = useState({ total_gastos: 0, resultado: 0 });
  const [rendas, setRendas] = useState([]);

  // Fetch expenses, totals, and rendas from API
  const fetchGastos = async () => {
    try {
      const res = await axios.get("http://localhost:8000/receber_todos_os_gastos");
      setGastos(res.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setIsLoading(false);
    }
  };

  const fetchTotalData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/receber_gastos_totais");
      setTotalData(res.data);
    } catch (error) {
      console.error("Error fetching total data:", error);
    }
  };

  const fetchRendas = async () => {
    try {
      const res = await axios.get("http://localhost:8000/listar_todas_as_rendas");
      setRendas(res.data);
    } catch (error) {
      console.error("Error fetching rendas:", error);
    }
  };

  useEffect(() => {
    fetchGastos();
    fetchTotalData();
    fetchRendas();
  }, []);

  const handleAddGasto = async () => {
    if (!nome || !tipo || !valor) return;

    try {
      const endpoint = recorrente 
        ? "adicionar_gastos_recorrentes" 
        : "adicionar_gastos_singulares";
      
      await axios.post(`http://localhost:8000/${endpoint}`, {
        nome,
        tipo,
        valor: parseFloat(valor)
      });

      setNome("");
      setTipo("");
      setValor("");
      fetchGastos();
      fetchTotalData();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleAddRenda = async () => {
    if (!renda) return;

    try {
      await axios.post("http://localhost:8000/adicionar_renda", {
        valor: parseFloat(renda)
      });
      setRenda("");
      setIsRendaFormOpen(false);
      fetchRendas();
      fetchTotalData();
    } catch (error) {
      console.error("Error adding renda:", error);
    }
  };

  const handleDeleteGasto = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/remover_gasto/${id}`);
      fetchGastos();
      fetchTotalData();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleDeleteRenda = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/deletar_renda/${id}`);
      fetchRendas();
      fetchTotalData();
    } catch (error) {
      console.error("Error deleting renda:", error);
    }
  };

  const filteredGastos = activeTab === "all" 
    ? gastos 
    : gastos.filter(g => g.recorrente === (activeTab === "recorrentes"));

  return (
    <div className="finance-container">
      {/* Header */}
      <h1 className="app-header float-animation">
        Aplicativo Financeiro para Amanda 🐈
      </h1>

      {/* Add Renda Form */}
      <div className="form-card renda-form">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsRendaFormOpen(!isRendaFormOpen)}
        >
          <h2 className="text-xl font-semibold text-pink-700">
            <i className="fas fa-wallet mr-2"></i>
             {isRendaFormOpen ? " Adicionar Renda" : " Renda Mensal"}
          </h2>
          <i className={`fas fa-chevron-${isRendaFormOpen ? "up" : "down"} text-pink-700`}></i>
        </div>
        {isRendaFormOpen && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-pink-600 mb-1">
                <i className="fas fa-money-bill-wave mr-1"></i> Valor da Renda (R$):
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 rounded-xl border border-pink-200 form-styled-input"
                placeholder="Ex: 5000.00"
                value={renda}
                onChange={(e) => setRenda(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAddRenda}
              className="gradient-button py-3 px-4 w-full"
            >
              <i className="fas fa-save mr-2"></i> Adicionar Renda
            </button>
          </div>
        )}
        {!isRendaFormOpen && rendas.length > 0 && (
          <div className="mt-4 space-y-2">
            {rendas.map((renda) => (
              <div key={renda._id} className="renda-item">
                <span className="text-pink-700 font-semibold">R$ {renda.valor.toFixed(2)}</span>
                <button
                  onClick={() => handleDeleteRenda(renda._id)}
                  className="delete-icon ml-2"
                  title="Remove renda"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
            <div className="text-right text-pink-600 mt-2">
              Total Renda: R$ {rendas.reduce((sum, r) => sum + r.valor, 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Form */}
      <div className="form-card">
        <h2 className="text-xl font-semibold text-pink-700 mb-4">
          <i className="fas fa-plus-circle mr-2"></i> Adicionar Novo Gasto
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pink-600 mb-1">
              <i className="fas fa-tag mr-1"></i> Gasto:
            </label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-pink-200 form-styled-input"
              placeholder="Ex: Aluguel"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-600 mb-1">
              <i className="fas fa-list-ul mr-1"></i> Tipo do Gasto:
            </label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-pink-200 form-styled-input"
              placeholder="Ex: Moradia"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-600 mb-1">
              <i className="fas fa-money-bill-wave mr-1"></i> Valor (R$):
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full p-3 rounded-xl border border-pink-200 form-styled-input"
              placeholder="Ex: 1231.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="recorrente"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
              className="h-5 w-5 text-pink-600 rounded"
            />
            <label htmlFor="recorrente" className="ml-2 text-sm text-pink-700">
              <i className="fas fa-redo mr-1"></i> Gasto Recorrente
            </label>
          </div>

          <button 
            onClick={handleAddGasto}
            className="gradient-button py-3 px-4 w-full"
          >
            <i className="fas fa-save mr-2"></i> Adicionar Gasto
          </button>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-pink-100">
          <button
            onClick={() => setActiveTab("all")}
            className={`tab-button ${activeTab === "all" ? "tab-active" : "text-pink-400 hover:text-pink-600"}`}
          >
            <i className="fas fa-list mr-1"></i> Todos
          </button>
          <button
            onClick={() => setActiveTab("recorrentes")}
            className={`tab-button ${activeTab === "recorrentes" ? "tab-active" : "text-pink-400 hover:text-pink-600"}`}
          >
            <i className="fas fa-redo mr-1"></i> Recorrentes
          </button>
          <button
            onClick={() => setActiveTab("singulares")}
            className={`tab-button ${activeTab === "singulares" ? "tab-active" : "text-pink-400 hover:text-pink-600"}`}
          >
            <i className="fas fa-check-circle mr-1"></i> Singulares
          </button>
        </div>

        {/* Expense Items */}
        {isLoading ? (
          <div className="p-8 text-center">
            <i className="fas fa-spinner fa-spin text-pink-500 text-2xl"></i>
          </div>
        ) : filteredGastos.length === 0 ? (
          <div className="p-8 text-center text-pink-400">
            <i className="far fa-frown-open text-2xl mb-2"></i>
            <p>Nenhum gasto encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-pink-50">
            {filteredGastos.map((gasto) => (
              <div key={gasto._id} className="expense-card">
                <button
                  onClick={() => handleDeleteGasto(gasto._id)}
                  className="delete-icon"
                  title="Remove expense"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="expense-info-block">
                  <div className="expense-name">
                    <i className="fas fa-receipt mr-2"></i> {gasto.nome}
                  </div>
                  <div className="expense-type"> {gasto.tipo}</div>
                </div>
                <div className="expense-details-block">
                  <div className="expense-amount">
                    R$ {gasto.valor.toFixed(2)}
                  </div>
                  <div className={`badge-${gasto.recorrente ? "recorrente" : "singular"}`}>
                    {gasto.recorrente ? (
                      <i className="fas fa-redo mr-1"></i>
                    ) : (
                      <i className="fas fa-check-circle mr-1"></i>
                    )}
                    {gasto.recorrente ? "Recorrente" : "Singular"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Summary */}
        {activeTab === "all" && (
          <div className="p-5 bg-pink-50 border-t border-pink-100">
            <div className="flex justify-between font-semibold text-pink-700">
              <span>
                <i className="fas fa-calculator mr-2"></i> Total Gastos:
              </span>
              <span>R$ {totalData.total_gastos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-pink-700 mt-2">
              <span>
                <i className="fas fa-wallet mr-2"></i> Saldo Restante:
              </span>
              <span>R$ {totalData.resultado.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;