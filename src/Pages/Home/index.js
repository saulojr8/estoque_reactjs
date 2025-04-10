import { db } from '../../firebaseConnection'; // Importa a conexão com o Firebase
import './index.css'; // Importa o arquivo de estilos CSS
import { useState, useEffect } from 'react'; // Importa hooks do React
import { doc, collection, addDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore'; // Importa funções do Firestore
import { FaTrash, FaEdit, FaPlus, FaMinus } from 'react-icons/fa'; // Importa ícones do React Icons
import jsPDF from 'jspdf'; // Importa a biblioteca jsPDF para gerar PDFs
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function Estoque() {
  // Declaração de estados usando o hook useState
  const [produto, setProduto] = useState(''); // Estado para o nome do produto
  const [quantidade, setQuantidade] = useState(''); // Estado para a quantidade do produto
  const [posts, setPosts] = useState([]); // Estado para armazenar a lista de produtos
  const [modalOpen, setModalOpen] = useState(false); // Controla a visibilidade do modal
  const [editItem, setEditItem] = useState(null); // Armazena o item sendo editado
  const [editProduto, setEditProduto] = useState(''); // Estado para o nome do produto em edição
  const [modalTipo, setModalTipo] = useState(''); // Define o tipo de ação no modal (entrada, saída ou edição)
  const [ajusteQuantidade, setAjusteQuantidade] = useState(''); // Quantidade a ser ajustada no estoque
  const [filtro, setFiltro] = useState(''); // Estado para o filtro de pesquisa

  // Hook useEffect para carregar os dados do Firestore em tempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "estoque"), (snapshot) => {
      // Mapeia os documentos do Firestore para um array de objetos
      let listaPost = snapshot.docs.map(doc => ({
        id: doc.id,
        produto: doc.data().produto,
        quantidade: doc.data().quantidade,
      }));
      setPosts(listaPost); // Atualiza o estado com a lista de produtos
    });
    return () => unsub(); // Função de cleanup para desinscrever o listener
  }, []);

  // Função assíncrona para adicionar um novo produto ao estoque
  async function handleAdd() {
    await addDoc(collection(db, "estoque"), {
      produto,
      quantidade,
    }).then(() => {
      toast.success("Cadastro feito com sucesso!"); // Notifica o sucesso, exibe uma notificação em
      setProduto(''); // Limpa o campo de produto
      setQuantidade(''); // Limpa o campo de quantidade
    }).catch(error => alert("Erro: " + error)); // Exibe erro, se houver
  }

  // Função assíncrona para excluir um produto do estoque
  async function excluirPost(id) {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este produto?");
    if (confirmacao) {
      await deleteDoc(doc(db, "estoque", id))
        .then(() => toast.warn("Cadastro excluido com sucesso!")) // Notifica o sucesso
        .catch(error => alert("Erro: " + error)); // Exibe erro, se houver
    }
  }

  // Função para abrir o modal e configurar os dados de edição ou ajuste
  function abrirModal(post, tipo) {
    setEditItem(post); // Define o item a ser editado
    setModalTipo(tipo); // Define o tipo de ação (entrada, saída ou edição)
    setAjusteQuantidade(''); // Reseta a quantidade de ajuste
    setEditProduto(post.produto); // Preenche o campo de edição com o nome do produto
    setModalOpen(true); // Abre o modal
  }

  // Função assíncrona para salvar ajustes ou edições no estoque
  async function salvarAjuste() {
    if (!editItem) return; // Sai da função se não houver item para editar
    let novaQuantidade = parseInt(editItem.quantidade); // Converte a quantidade atual para número
    let ajuste = parseInt(ajusteQuantidade); // Converte o ajuste para número
    if (modalTipo === 'entrada') {
      novaQuantidade += ajuste; // Aumenta a quantidade para entrada
    } else if (modalTipo === 'saida') {
      novaQuantidade -= ajuste; // Diminui a quantidade para saída
      if (novaQuantidade < 0) novaQuantidade = 0; // Evita quantidades negativas
    } else if (modalTipo === 'editar') {
      // Atualiza apenas o nome do produto no Firestore
      await updateDoc(doc(db, "estoque", editItem.id), {
        produto: editProduto,
      }).then(() => {
        toast.success("Produto atualizado!"); // Notifica o sucesso
        setModalOpen(false); // Fecha o modal
        setEditItem(null); // Limpa o item em edição
      }).catch(error => alert("Erro: " + error)); // Exibe erro, se houver
      return;
    }
    // Atualiza a quantidade no Firestore
    await updateDoc(doc(db, "estoque", editItem.id), {
      quantidade: novaQuantidade.toString(),
    }).then(() => {
      toast.success("Quantidade ajustada!"); // Notifica o sucesso
      setModalOpen(false); // Fecha o modal
      setEditItem(null); // Limpa o item em edição
    }).catch(error => alert("Erro: " + error)); // Exibe erro, se houver
  }

  // Função base para gerar o PDF com o resumo do estoque
  function gerarPDFBase() {
    const doc = new jsPDF(); // Cria uma nova instância do jsPDF
    doc.text("Resumo do Estoque", 10, 10); // Adiciona o título ao PDF

    let y = 20; // Define a posição inicial no eixo Y
    posts.forEach((post, index) => {
      // Adiciona cada produto ao PDF
      doc.text(`${index + 1}. Produto: ${post.produto} - Quantidade: ${post.quantidade}`, 10, y);
      y += 10; // Incrementa a posição Y para a próxima linha
    });

    return doc; // Retorna o documento PDF gerado
  }

  // Função para baixar o PDF gerado
  function baixarPDF() {
    const doc = gerarPDFBase(); // Gera o PDF
    doc.save("resumo_estoque.pdf"); // Salva o PDF com o nome especificado
    toast.success("PDF baixado com sucesso! "); // Notifica o sucesso
  }

  // Função para compartilhar o PDF usando a API Web Share
  async function compartilharPDF() {
    const doc = gerarPDFBase(); // Gera o PDF
    const pdfBlob = doc.output('blob'); // Converte o PDF para um Blob
    const pdfFile = new File([pdfBlob], "resumo_estoque.pdf", { type: "application/pdf" }); // Cria um arquivo PDF

    if (navigator.share) { // Verifica se o navegador suporta a API de compartilhamento
      try {
        await navigator.share({
          files: [pdfFile], // Arquivo a ser compartilhado
          title: 'Resumo do Estoque', // Título do compartilhamento
          text: 'Aqui está o resumo dos produtos em estoque.', // Texto do compartilhamento
        });
        console.log("PDF compartilhado com sucesso!"); // Log de sucesso
      } catch (error) {
        console.error("Erro ao compartilhar o PDF:", error); // Log de erro
        alert("Erro ao compartilhar o PDF. Você pode baixá-lo manualmente."); // Notifica o erro
        doc.save("resumo_estoque.pdf"); // Fallback para download
      }
    } else {
      alert("Compartilhamento não suportado neste navegador. Baixando o arquivo..."); // Notifica falta de suporte
      doc.save("resumo_estoque.pdf"); // Download direto como fallback
    }
  }

  // Filtra os produtos com base no valor do filtro
  const postsFiltrados = posts.filter(post =>
    post.produto.toLowerCase().includes(filtro.toLowerCase())
  );

  // Renderização do componente
  return (
    <div className='container'>
      {/* Seção para cadastrar novos produtos */}
      <div className='div-cadastros'>
        <h1 className='cad__titulo'>Cadastrar Produtos</h1>
        <label> Nome do Produto</label>
        <input type='text' placeholder='Digite o produto' value={produto} onChange={(e) => setProduto(e.target.value)} />
        <label> Quantidade de entrada</label>
        <input type='text' placeholder='Especifique a quantidade' value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        <button onClick={handleAdd} className='btn__cadastrar'>Cadastrar</button>      
      </div>

      {/* Seção para filtrar produtos */}
      <div className='div-filtro'>
        <h1>Pesquisar Produto</h1>
        <input
          type='text'
          placeholder='Digite para filtrar...'
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* Seção para gerar e compartilhar o PDF */}
      <div className='btn__pdf'>
        <h1>Resumo do estoque</h1>
        <button onClick={baixarPDF} style={{ marginBottom: '10px', marginRight: '10px' }}>Baixar PDF</button>
        <button onClick={compartilharPDF} style={{ marginBottom: '10px' }}>Compartilhar PDF</button>
      </div>

      {/* Seção para listar os produtos */}
      <div className='div-resultado'>
        <ul>
          <h1>Listagem de Produtos:</h1>
          {postsFiltrados.map((post) => (
            <li key={post.id}>
              <span>Produto: {post.produto}</span>
              <span>Quantidade: {post.quantidade}</span>
              <button className='button-adicionar' onClick={() => abrirModal(post, 'entrada')}><FaPlus /></button>
              <button className='button-retirar' onClick={() => abrirModal(post, 'saida')}><FaMinus /></button>
              <button className='button-editar' onClick={() => abrirModal(post, 'editar')}><FaEdit /></button>
              <button className='button-remover' onClick={() => excluirPost(post.id)}><FaTrash /></button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Modal para entrada, saída ou edição de produtos */}
      {modalOpen && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h2>{modalTipo === 'entrada' ? 'Dar Entrar de Estoque' : modalTipo === 'saida' ? 'Dar Saida de Estoque' : 'Editar Produto'}</h2>
            {modalTipo === 'editar' ? (
              <>
                <label>Produto:</label>
                <input type='text' value={editProduto} onChange={(e) => setEditProduto(e.target.value)} />
              </>
            ) : (
              <>
                <label>Quantidade:</label>
                <input type='number' value={ajusteQuantidade} onChange={(e) => setAjusteQuantidade(e.target.value)} />
              </>
            )}
            <button onClick={salvarAjuste}>Salvar</button>
            <button onClick={() => setModalOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Estoque; // Exporta o componente Estoque