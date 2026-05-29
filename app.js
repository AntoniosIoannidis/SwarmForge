// SwarmForge AI Engine - Scalable State Controller & Orchestrator

// ============================================================
// 1. APPLICATION STATE MANAGEMENT
// ============================================================
let swarmState = {
  nodes: [],
  connections: [],
  pan: { x: 0, y: 0 },
  zoom: 1,
  isDraggingCanvas: false,
  dragStart: { x: 0, y: 0 },
  activeNodeDrag: null,
  activePortDrag: null,
  activeConnectionId: null,
  swarmRunning: false,
  geminiKey: "",
  stepDelay: 3000,
  temperature: 0.7,
  realApiEnabled: false,
  
  // Vault storage for generated files
  artifacts: [],
  activeArtifactId: null
};

// Preset Swarm Configurations
const PRESETS = {
  "dev-team": {
    prompt: "Create a beautiful, fully functional visual Todo Kanban Board web app. Use glassmorphic card elements, drag-and-drop simulated task columns, vibrant colors (HSL), and local storage caching.",
    nodes: [
      { id: "planner", role: "planner", name: "System Architect", prompt: "Create a structured software backlog, listing all HTML layouts, CSS styling rules, and JS structures needed.", x: 80, y: 150 },
      { id: "researcher", role: "researcher", name: "Tech Researcher", prompt: "Search and gather best practices for native HTML5 Drag and Drop APIs, and premium glassmorphic visual designs.", x: 380, y: 50 },
      { id: "coder", role: "coder", name: "Lead Dev", prompt: "Write the complete index.html and app.js containing fully functional, robust drag-and-drop state code.", x: 380, y: 280 },
      { id: "designer", role: "designer", name: "UI Designer", prompt: "Generate custom premium CSS variables, styles, hover micro-animations, and glow themes.", x: 680, y: 150 },
      { id: "auditor", role: "auditor", name: "Audit Critic", prompt: "Review code structure, test XSS injection filters in inputs, and polish any visual layout alignment flaws.", x: 980, y: 150 }
    ],
    connections: [
      { id: "c1", fromId: "planner", toId: "researcher" },
      { id: "c2", fromId: "planner", toId: "coder" },
      { id: "c3", fromId: "researcher", toId: "designer" },
      { id: "c4", fromId: "coder", toId: "designer" },
      { id: "c5", fromId: "designer", toId: "auditor" }
    ]
  },
  "quant-board": {
    prompt: "Design a quantitative trading script to optimize portfolio returns on popular assets like NVDA and TSLA. Track 20-day SMA, RSI momentum vectors, and news buzz indexes.",
    nodes: [
      { id: "planner", role: "planner", name: "Quantitative Director", prompt: "Map technical indicator goals, asset target levels, and debate schedules.", x: 80, y: 150 },
      { id: "researcher", role: "researcher", name: "Data Analyst", prompt: "Fetch historical SMA indices and relative strength triggers for stock assets.", x: 380, y: 50 },
      { id: "coder", role: "coder", name: "Python Script Engineer", prompt: "Write a high-performance quantitative backtesting script executing indicators math in javascript.", x: 680, y: 50 },
      { id: "designer", role: "designer", name: "Sentiment Evaluator", prompt: "Parse high-impact news headers to evaluate social crowd fear & greed metrics.", x: 380, y: 280 },
      { id: "auditor", role: "auditor", name: "Board Auditor", prompt: "Synthesize the technical, pricing, and social metrics into a final BUY/SELL committee consensus report.", x: 980, y: 150 }
    ],
    connections: [
      { id: "c1", fromId: "planner", toId: "researcher" },
      { id: "c2", fromId: "planner", toId: "designer" },
      { id: "c3", fromId: "researcher", toId: "coder" },
      { id: "c4", fromId: "designer", toId: "auditor" },
      { id: "c5", fromId: "coder", toId: "auditor" }
    ]
  },
  "content-forge": {
    prompt: "Write an ultimate research dossier and blog campaign reviewing the future impacts of autonomous Multi-Agent AI Swarms.",
    nodes: [
      { id: "planner", role: "planner", name: "Chief Editor", prompt: "Define document structure, outlines, target themes, and editorial standards.", x: 80, y: 150 },
      { id: "researcher", role: "researcher", name: "Fact Researcher", prompt: "Gather raw historical timelines of AI milestones, swarms, and agentic layers.", x: 380, y: 150 },
      { id: "coder", role: "coder", name: "Creative Writer", prompt: "Write the complete research dossier in markdown with headers and visual diagrams.", x: 680, y: 150 },
      { id: "designer", role: "designer", name: "Social Content Designer", prompt: "Generate high-buzz executive summary hooks and templates tailored for social feeds.", x: 980, y: 50 },
      { id: "auditor", role: "auditor", name: "Copy Editor", prompt: "Review tone structure, polish flow transitions, and ensure factual clarity.", x: 980, y: 280 }
    ],
    connections: [
      { id: "c1", fromId: "planner", toId: "researcher" },
      { id: "c2", fromId: "researcher", toId: "coder" },
      { id: "c3", fromId: "coder", toId: "designer" },
      { id: "c4", fromId: "coder", toId: "auditor" }
    ]
  }
};

// ============================================================
// 2. INITIALIZATION & UI LISTENERS
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  setupCanvasControls();
  setupUIEventListeners();
  setupDragAndDrop();
  
  // Adjust sizing on resize
  window.addEventListener("resize", drawAllConnections);
});

// Setup drag listeners for sidebar items
function setupDragAndDrop() {
  const paletteItems = document.querySelectorAll(".palette-item");
  paletteItems.forEach(item => {
    item.addEventListener("click", () => {
      const role = item.dataset.role;
      addNewNode(role, 200, 200);
    });
  });
}

// Setup Event listeners for panels & controls
function setupUIEventListeners() {
  // Tab Switcher logic
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });

  // Global settings changes
  document.getElementById("step-delay").addEventListener("input", (e) => {
    swarmState.stepDelay = e.target.value * 1000;
    document.getElementById("delay-val").textContent = e.target.value;
  });

  document.getElementById("model-temp").addEventListener("input", (e) => {
    swarmState.temperature = e.target.value;
    document.getElementById("temp-val").textContent = e.target.value;
  });

  document.getElementById("toggle-real-api").addEventListener("change", (e) => {
    swarmState.realApiEnabled = e.target.checked;
    const apiBox = document.querySelector(".api-key-box");
    if (e.target.checked) {
      apiBox.classList.add("highlight-api-box");
    } else {
      apiBox.classList.remove("highlight-api-box");
    }
  });

  document.getElementById("gemini-key").addEventListener("input", (e) => {
    swarmState.geminiKey = e.target.value.trim();
  });

  // Action Buttons
  document.getElementById("btn-clear").addEventListener("click", clearWorkspace);
  document.getElementById("btn-clear-console").addEventListener("click", () => {
    document.getElementById("console-logs").innerHTML = "";
  });

  document.getElementById("btn-export").addEventListener("click", exportSwarmJSON);
  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", importSwarmJSON);

  document.getElementById("btn-run").addEventListener("click", toggleSwarmPipeline);
  
  document.getElementById("preset-select").addEventListener("change", (e) => {
    loadPreset(e.target.value);
  });

  // Copy Artifact
  document.getElementById("btn-copy-artifact").addEventListener("click", () => {
    const text = document.getElementById("artifact-content").textContent;
    if (text && text !== "Select a generated file from the list above to view its contents.") {
      navigator.clipboard.writeText(text);
      const originalText = document.getElementById("btn-copy-artifact").textContent;
      document.getElementById("btn-copy-artifact").textContent = "✓ Copied!";
      setTimeout(() => {
        document.getElementById("btn-copy-artifact").textContent = originalText;
      }, 1500);
    }
  });
}

// ============================================================
// 3. CANVAS PAN & DRAG ENGINE
// ============================================================
function setupCanvasControls() {
  const container = document.getElementById("canvas-container");
  const workspace = document.getElementById("canvas-workspace");

  // Track panning on canvas background
  container.addEventListener("mousedown", (e) => {
    // If clicking directly on container background (not on a node)
    if (e.target === container || e.target.tagName === "svg" || e.target === workspace) {
      swarmState.isDraggingCanvas = true;
      swarmState.dragStart = { x: e.clientX - swarmState.pan.x, y: e.clientY - swarmState.pan.y };
      workspace.style.cursor = "grabbing";
    }
  });

  document.addEventListener("mousemove", (e) => {
    // 1. Pan Canvas Workspace
    if (swarmState.isDraggingCanvas) {
      swarmState.pan.x = e.clientX - swarmState.dragStart.x;
      swarmState.pan.y = e.clientY - swarmState.dragStart.y;
      
      // Limit panning bounds
      swarmState.pan.x = Math.max(-2000, Math.min(200, swarmState.pan.x));
      swarmState.pan.y = Math.max(-2000, Math.min(200, swarmState.pan.y));

      workspace.style.transform = `translate(${swarmState.pan.x}px, ${swarmState.pan.y}px)`;
      drawAllConnections();
    }
    
    // 2. Drag Node Item
    if (swarmState.activeNodeDrag) {
      const node = swarmState.activeNodeDrag.node;
      const offset = swarmState.activeNodeDrag.offset;
      
      // Calculate mouse position inside workspace coordinate system
      const workspaceX = e.clientX - swarmState.pan.x;
      const workspaceY = e.clientY - swarmState.pan.y;
      
      node.x = workspaceX - offset.x;
      node.y = workspaceY - offset.y;

      // Bound nodes inside canvas workspace size
      node.x = Math.max(20, Math.min(3800, node.x));
      node.y = Math.max(20, Math.min(3800, node.y));

      const el = document.getElementById(`node-${node.id}`);
      if (el) {
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }
      drawAllConnections();
    }

    // 3. Draw Cable Connection dynamically during dragging output port
    if (swarmState.activePortDrag) {
      const startX = swarmState.activePortDrag.x;
      const startY = swarmState.activePortDrag.y;
      
      // Get mouse position relative to canvas-container
      const containerRect = container.getBoundingClientRect();
      const endX = e.clientX - containerRect.left;
      const endY = e.clientY - containerRect.top;

      let tempCable = document.getElementById("dragging-cable");
      if (!tempCable) {
        tempCable = document.createElementNS("http://www.w3.org/2000/svg", "path");
        tempCable.setAttribute("id", "dragging-cable");
        tempCable.setAttribute("class", "dragging-cable");
        document.getElementById("connection-svg").appendChild(tempCable);
      }
      
      const path = getBezierPath(startX, startY, endX, endY);
      tempCable.setAttribute("d", path);
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (swarmState.isDraggingCanvas) {
      swarmState.isDraggingCanvas = false;
      workspace.style.cursor = "grab";
    }

    if (swarmState.activeNodeDrag) {
      swarmState.activeNodeDrag = null;
    }

    // Connect cables if dropped on an input port
    if (swarmState.activePortDrag) {
      const tempCable = document.getElementById("dragging-cable");
      if (tempCable) tempCable.remove();

      // Check if dropped on an input port
      const targetPort = e.target.closest(".port-input");
      if (targetPort) {
        const fromNodeId = swarmState.activePortDrag.fromNodeId;
        const toNodeId = targetPort.dataset.nodeId;

        // Prevent loops or self connections
        if (fromNodeId !== toNodeId) {
          createNewConnection(fromNodeId, toNodeId);
        }
      }
      swarmState.activePortDrag = null;
    }
  });
}

// ============================================================
// 4. NODES OPERATIONS & STATE MUTATORS
// ============================================================

// Adds a new agent node to the workspace
function addNewNode(role, x, y, id = null) {
  // Hide Welcome Panel if open
  document.getElementById("canvas-welcome").classList.add("hidden");

  const nodeId = id || `${role}-${Date.now().toString().slice(-4)}`;
  
  // Set Default Node Values based on role
  let roleName = "AI Agent";
  let promptText = "Perform structural logic based on context inputs.";
  
  if (role === "planner") {
    roleName = "System Planner";
    promptText = "Outline backlogs and map API components.";
  } else if (role === "researcher") {
    roleName = "Data Researcher";
    promptText = "Extract stats, links, and comparative references.";
  } else if (role === "coder") {
    roleName = "Code Engineer";
    promptText = "Write clean modules, files, and scripts.";
  } else if (role === "designer") {
    roleName = "UI Designer";
    promptText = "Format custom typography, themes, CSS, and animations.";
  } else if (role === "auditor") {
    roleName = "Code Auditor";
    promptText = "Verify structure, test vulnerabilities, and optimize margins.";
  }

  const newNode = {
    id: nodeId,
    role: role,
    name: roleName,
    prompt: promptText,
    x: x,
    y: y
  };

  swarmState.nodes.push(newNode);
  renderNodeHTML(newNode);
  drawAllConnections();
  
  logSystem(`Added Node: [${roleName}] to workspace canvas.`);
  return newNode;
}

// Renders visual Node HTML box
function renderNodeHTML(node) {
  const workspace = document.getElementById("canvas-workspace");
  const el = document.createElement("div");
  el.className = "node-box";
  el.id = `node-${node.id}`;
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;

  // Color theme headers based on role
  let headerStyle = "background: var(--bg-tertiary);";
  let roleIcon = "🤖";
  if (node.role === "planner") { headerStyle = "background: var(--info);"; roleIcon = "📋"; }
  else if (node.role === "researcher") { headerStyle = "background: var(--accent-secondary);"; roleIcon = "🔍"; }
  else if (node.role === "coder") { headerStyle = "background: var(--accent-primary);"; roleIcon = "💻"; }
  else if (node.role === "designer") { headerStyle = "background: var(--warning); color: #000;"; roleIcon = "🎨"; }
  else if (node.role === "auditor") { headerStyle = "background: var(--danger);"; roleIcon = "🛡️"; }

  el.innerHTML = `
    <div class="node-header" style="${headerStyle}">
      <div class="node-title-group">
        <span class="node-title-icon">${roleIcon}</span>
        <span id="node-name-text-${node.id}">${node.name}</span>
      </div>
      <button class="btn-delete-node" onclick="deleteNode('${node.id}')" title="Delete Node">×</button>
    </div>
    <div class="node-body">
      <div class="node-input-group">
        <label>Agent Name</label>
        <input type="text" id="input-name-${node.id}" value="${node.name}">
      </div>
      <div class="node-input-group">
        <label>Agent Instruction Directive</label>
        <textarea id="input-prompt-${node.id}">${node.prompt}</textarea>
      </div>
    </div>
    <!-- Input/Output Handle ports -->
    <div class="port port-input" data-node-id="${node.id}" title="Input Handle"></div>
    <div class="port port-output" data-node-id="${node.id}" title="Output Handle"></div>
  `;

  workspace.appendChild(el);

  // Sync state with inputs
  el.querySelector(`#input-name-${node.id}`).addEventListener("input", (e) => {
    node.name = e.target.value.trim() || node.role.toUpperCase();
    document.getElementById(`node-name-text-${node.id}`).textContent = node.name;
  });

  el.querySelector(`#input-prompt-${node.id}`).addEventListener("input", (e) => {
    node.prompt = e.target.value.trim();
  });

  // Mouse drag handlers on Header
  const header = el.querySelector(".node-header");
  header.addEventListener("mousedown", (e) => {
    if (e.target.tagName !== "BUTTON") {
      swarmState.activeNodeDrag = {
        node: node,
        offset: {
          x: (e.clientX - swarmState.pan.x) - node.x,
          y: (e.clientY - swarmState.pan.y) - node.y
        }
      };
      
      // Make active
      document.querySelectorAll(".node-box").forEach(n => n.classList.remove("active"));
      el.classList.add("active");
      
      e.stopPropagation();
    }
  });

  // Port connection cable drag start
  const outPort = el.querySelector(".port-output");
  outPort.addEventListener("mousedown", (e) => {
    const container = document.getElementById("canvas-container");
    const containerRect = container.getBoundingClientRect();
    
    // Get exact center coordinate of the output port relative to container
    const portRect = outPort.getBoundingClientRect();
    const x = (portRect.left + portRect.width / 2) - containerRect.left;
    const y = (portRect.top + portRect.height / 2) - containerRect.top;

    swarmState.activePortDrag = {
      fromNodeId: node.id,
      x: x,
      y: y
    };
    e.stopPropagation();
    e.preventDefault();
  });
}

// Delete Node and associated connections
function deleteNode(nodeId) {
  // Remove connections
  swarmState.connections = swarmState.connections.filter(c => c.fromId !== nodeId && c.toId !== nodeId);
  
  // Remove state node
  swarmState.nodes = swarmState.nodes.filter(n => n.id !== nodeId);

  // Remove DOM element
  const el = document.getElementById(`node-${nodeId}`);
  if (el) el.remove();

  // Show welcome screen if no nodes left
  if (swarmState.nodes.length === 0) {
    document.getElementById("canvas-welcome").classList.remove("hidden");
  }

  drawAllConnections();
  logSystem(`Removed Node: ${nodeId}.`);
}

// ============================================================
// 5. CONNECTIONS & CABLES DRAWING ENGINE
// ============================================================

// Adds a new persistent connection
function createNewConnection(fromId, toId) {
  // Prevent duplicate connections
  const duplicate = swarmState.connections.find(c => c.fromId === fromId && c.toId === toId);
  if (duplicate) return;

  const connId = `conn-${fromId}-${toId}`;
  const newConn = {
    id: connId,
    fromId: fromId,
    toId: toId
  };

  swarmState.connections.push(newConn);
  drawAllConnections();
  logSystem(`Connected Agent [${fromId}] ➔ [${toId}].`);
}

// Clear connections overlay and redraw all paths
function drawAllConnections() {
  const svg = document.getElementById("connection-svg");
  const container = document.getElementById("canvas-container");
  
  // Clear old connection paths (except dragging-cable)
  const paths = svg.querySelectorAll("path:not(.dragging-cable)");
  paths.forEach(p => p.remove());

  const containerRect = container.getBoundingClientRect();

  swarmState.connections.forEach(conn => {
    const fromNodeEl = document.getElementById(`node-${conn.fromId}`);
    const toNodeEl = document.getElementById(`node-${conn.toId}`);

    if (fromNodeEl && toNodeEl) {
      const outPort = fromNodeEl.querySelector(".port-output");
      const inPort = toNodeEl.querySelector(".port-input");

      if (outPort && inPort) {
        const outRect = outPort.getBoundingClientRect();
        const inRect = inPort.getBoundingClientRect();

        // Calculate absolute center coords relative to SVG container bounding box
        const x1 = (outRect.left + outRect.width / 2) - containerRect.left;
        const y1 = (outRect.top + outRect.height / 2) - containerRect.top;

        const x2 = (inRect.left + inRect.width / 2) - containerRect.left;
        const y2 = (inRect.top + inRect.height / 2) - containerRect.top;

        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("class", "connection-path");
        pathEl.setAttribute("id", conn.id);
        
        // Connect markers/arrows
        pathEl.setAttribute("marker-end", "url(#arrow)");
        
        const path = getBezierPath(x1, y1, x2, y2);
        pathEl.setAttribute("d", path);

        // Right-click connection to delete it
        pathEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          deleteConnection(conn.id);
        });

        // Insert behind nodes
        svg.appendChild(pathEl);
      }
    }
  });
}

// Delete a connection
function deleteConnection(connId) {
  swarmState.connections = swarmState.connections.filter(c => c.id !== connId);
  drawAllConnections();
  logSystem("Removed connection link.");
}

// Bezier Curve mathematical formula for fluid vector cables
function getBezierPath(x1, y1, x2, y2) {
  const controlOffset = Math.abs(x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
}

// Clear all canvas elements
function clearWorkspace() {
  document.getElementById("canvas-workspace").innerHTML = `
    <div class="canvas-welcome" id="canvas-welcome">
      <div class="welcome-card">
        <h2>Design Your Swarm</h2>
        <p>Add nodes from the sidebar, link their connection handles, configure their variables, and click **Run Swarm Pipeline** to watch them coordinate live!</p>
        <div class="presets-shortcut">
          <button class="btn btn-small" onclick="loadPreset('dev-team')">💻 Load Dev Team</button>
          <button class="btn btn-small" onclick="loadPreset('quant-board')">📈 Load Quant Board</button>
        </div>
      </div>
    </div>
  `;
  
  swarmState.nodes = [];
  swarmState.connections = [];
  swarmState.artifacts = [];
  swarmState.activeArtifactId = null;

  renderArtifactsUI();
  drawAllConnections();
  logSystem("Workspace cleared.");
}

// ============================================================
// 6. SWARM EXECUTION PIPELINE ENGINE
// ============================================================

// Toggles Swarm Pipeline RUN / STOP
function toggleSwarmPipeline() {
  if (swarmState.swarmRunning) {
    stopSwarmPipeline();
  } else {
    startSwarmPipeline();
  }
}

function stopSwarmPipeline() {
  swarmState.swarmRunning = false;
  document.getElementById("btn-run").textContent = "⚡ Run Swarm Pipeline";
  document.getElementById("btn-run").className = "btn btn-primary btn-glow";
  
  const statusIndicator = document.querySelector(".status-indicator");
  statusIndicator.className = "status-indicator idle";
  document.getElementById("status-text").textContent = "Swarm State: Stopped";
  
  // Clear node thinking glows
  document.querySelectorAll(".node-box").forEach(n => n.classList.remove("thinking"));
  
  logSystem("⚠️ Swarm pipeline execution halted manually.");
}

// Main autonomous workflow scheduler
async function startSwarmPipeline() {
  if (swarmState.nodes.length === 0) {
    alert("Canvas is empty. Please add at least 1 agent node to your swarm canvas before running.");
    return;
  }

  swarmState.swarmRunning = true;
  document.getElementById("btn-run").textContent = "🛑 Stop Swarm Pipeline";
  document.getElementById("btn-run").className = "btn btn-danger";
  
  const statusIndicator = document.querySelector(".status-indicator");
  statusIndicator.className = "status-indicator running";
  document.getElementById("status-text").textContent = "Swarm State: Working...";

  logSystem("🚀 Swarm Pipeline launched. Ingesting master directives...");
  
  // Switch to logs console tab automatically
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelector(".tab-btn[data-tab='console']").classList.add("active");
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("tab-console").classList.add("active");

  const masterGoal = document.getElementById("swarm-prompt").value.trim();
  logSystem(`Master swarm goal compiled: "${masterGoal}"`);

  // Calculate topological order (execution schedule list)
  const schedule = getExecutionSchedule();
  
  logSystem(`Pipeline schedule compiled: [${schedule.map(n => n.name).join(" ➔ ")}]`);

  // Start sequence execution
  try {
    let inputsContext = `Swarm Global Goal: "${masterGoal}"\n\n`;

    for (let i = 0; i < schedule.length; i++) {
      if (!swarmState.swarmRunning) break; // Halts if user clicked stop

      const node = schedule[i];
      const nodeEl = document.getElementById(`node-${node.id}`);
      
      // Update visual indicators
      nodeEl.classList.add("thinking");
      logSystem(`[Node: ${node.name}] active. Formulating AI agent response...`);
      
      // Make the cable leading to this node glow active
      activateIncomingCables(node.id, true);

      let agentResult = "";

      if (swarmState.realApiEnabled && swarmState.geminiKey) {
        // CALL REAL GEMINI API FOR REAL MULTI-AGENT SWARM
        agentResult = await executeGeminiAgentNode(node, inputsContext);
      } else {
        // RUN HIGH-FIDELITY SIMULATED QUANT / SOFTWARE CODE DEBATES
        agentResult = await executeSimulatedAgentNode(node, masterGoal, i);
      }

      if (!swarmState.swarmRunning) break;

      // Typewriter log output
      typewriterLog(node.role, node.name, agentResult);

      // Append result to global pipeline context
      inputsContext += `--- OUTPUT FROM [${node.name} (Role: ${node.role})] ---\n${agentResult}\n\n`;

      // Clear glows
      nodeEl.classList.remove("thinking");
      activateIncomingCables(node.id, false);
      
      // Dynamic sleep delay between pipeline steps
      await sleep(swarmState.stepDelay);
    }

    if (swarmState.swarmRunning) {
      logSystem("✅ Swarm pipeline successfully achieved consensus. Code/dossier deliverables cached in vault.");
      stopSwarmPipeline();
    }
  } catch (err) {
    console.error("Swarm execution failed:", err);
    logSystem(`❌ ERROR during execution: ${err.message}`);
    stopSwarmPipeline();
  }
}

// Compute execution order. Start with nodes with no inputs, follow connections
function getExecutionSchedule() {
  const schedule = [];
  const visited = new Set();
  
  // Fast topological resolver
  function visit(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = swarmState.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Visit parent dependencies first (nodes leading INTO this node)
    const parents = swarmState.connections.filter(c => c.toId === nodeId);
    parents.forEach(p => visit(p.fromId));

    schedule.push(node);
  }

  // Visit all nodes. Starting from endpoints forces dependency sorting
  swarmState.nodes.forEach(node => visit(node.id));
  return schedule;
}

// Highlights active connecting cables during execution
function activateIncomingCables(nodeId, activate) {
  swarmState.connections.forEach(conn => {
    if (conn.toId === nodeId) {
      const path = document.getElementById(conn.id);
      if (path) {
        if (activate) {
          path.classList.add("active");
          path.setAttribute("marker-end", "url(#arrow-active)");
        } else {
          path.classList.remove("active");
          path.setAttribute("marker-end", "url(#arrow)");
        }
      }
    }
  });
}

// ============================================================
// 7. REAL GEMINI SWARM API IMPLEMENTATION
// ============================================================
async function executeGeminiAgentNode(node, context) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${swarmState.geminiKey}`;
  
  const systemInstructions = `
  You are an autonomous AI Agent in a Swarm Forge Pipeline. 
  Your Specific Role: ${node.name} (Specialist: ${node.role}).
  Your instruction directive: "${node.prompt}".
  
  You must process the global goal, read the previous agents' work in the pipeline context, and produce the next iteration or deliverable.
  If you are a Coder or UI Designer, write actual HTML/CSS/JS file code inside fenced blocks (e.g. \`\`\`html ... \`\`\` or \`\`\`css ... \`\`\`).
  Keep your responses concise, highly technical, and strictly focused on solving the directive.
  `;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemInstructions}\n\n--- PIPELINE EXECUTION CONTEXT ---\n${context}\n\nProduce your specialized output now.` }
        ]
      }
    ],
    generationConfig: {
      temperature: parseFloat(swarmState.temperature)
    }
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API returned status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const resultText = data.candidates[0].content.parts[0].text;
      
      // Parse any files generated by the real Gemini API automatically!
      extractRealFilesFromResponse(node, resultText);
      return resultText;
    } else {
      throw new Error("Empty candidate payload returned from API.");
    }
  } catch (e) {
    throw new Error(`Gemini Agent Call failed: ${e.message}`);
  }
}

// Scrapes dynamic code blocks out of live Gemini responses and registers them in the Vault
function extractRealFilesFromResponse(node, text) {
  const markdownCodeRegex = /```(html|css|javascript|js|markdown|python)?\s*([\s\S]*?)```/g;
  let match;
  let index = 1;

  while ((match = markdownCodeRegex.exec(text)) !== null) {
    const lang = match[1] || "txt";
    const code = match[2].trim();
    let filename = `agent_${node.role}_output_${index}.${lang === "javascript" || lang === "js" ? "js" : lang}`;
    
    // Smart filenames
    if (lang === "html") filename = "index.html";
    else if (lang === "css") filename = "styles.css";
    else if (lang === "markdown") filename = "dossier.md";
    
    registerArtifact(filename, code);
    index++;
  }
}

// ============================================================
// 8. QUANTITATIVE / DEBATE SIMULATION GRAPHICS
// ============================================================
async function executeSimulatedAgentNode(node, goal, step) {
  return new Promise((resolve) => {
    // High-fidelity predefined responses mock outputs
    const mockDb = {
      planner: [
        `PROPOSAL & SYSTEM ARCHITECTURE FOR: "${goal}"\n\nI have evaluated the core scope and broken it down into modular development milestones.\n\n1. HTML Structure Blueprint:\n   - Grid containers hosting visual widgets.\n   - Modal overlay for granular portfolio audits.\n2. CSS Styling Systems:\n   - Curie HSL primary and secondary neon indicators.\n   - Border-radius tokens supporting glass card frames.\n3. Javascript Logic Modules:\n   - Dynamic chart rendering using lightweight Vector formulas.\n   - Real-time simulation state intervals.\n\nI connect output ports directly to developer pipelines.`,
        `STRATEGIC INGESTION DIRECTIVE: "${goal}"\n\nInitial backlog structured for Quant debate committee. Setting parameters:\n- Target tickers: NVDA (Nvidia Corp), TSLA (Tesla Inc).\n- Indicator vectors: 20-day SMA, 14-day RSI oscillators.\n- Pipeline schedule: Researcher collects rates ➔ Python engine runs indicator checks ➔ Auditor compiles consensus.`
      ],
      researcher: [
        `FACT-FINDING REPORT & TECH DATA SHEET:\n\nIngesting planner blueprints. Gearing up research for CSS Drag and Drop utilities:\n- Native HTML5 elements must handle event list bindings: dragstart, dragover, drop, dragend.\n- Caching node positions in localStorage yields smooth, fast loading across refreshes.\n- Styling handles using translucent drop outlines creates visual cue feedback.\n\nReady for developer compilation.`,
        `MARKET DATA FEEDBACK: NVDA & TSLA ANALYSIS:\n\nCollected live ticker stats for board evaluation:\n- Ticker: NVDA | Price: $1,154.20 | SMA-20: $1,080.50 (Bullish gap: +6.8%)\n- Ticker: TSLA | Price: $178.50  | SMA-20: $184.20 (Bearish gap: -3.1%)\n- RSI Indices: NVDA is sitting at 74 (Overbought zone) | TSLA is sitting at 42 (Neutral oversold boundary).\n\nForwarding index vectors to Python script sandbox.`
      ],
      coder: [
        `FILE MODULE GENERATED: index.html\n\n(See Generated Vault Tab for completed source code. Highlights: full Drag & Drop API hooks, modal state structures, and premium glassmorphic dark interface layouts)`,
        `FILE MODULE GENERATED: app_backtest.py\n\n(See Generated Vault Tab for completed python script. Contains pandas integrations, RSI evaluation routines, and portfolio weight metrics calculator)`
      ],
      designer: [
        `FILE MODULE GENERATED: styles.css\n\n(See Generated Vault Tab for completed CSS theme system. Loaded with neon purple/teal HSL primary variables, card glows, dot grids, and skeleton loads)`,
        `SENTIMENT ANALYSIS NEWS FEED REPORTS:\n\nScraped social sentiment buzz logs for asset evaluations:\n1. "NVIDIA chips command absolute monopoly in quantitative AI clusters" - Buzz: HIGH (94% BULLISH)\n2. "Tesla margins contract as vehicle volumes experience range consolidation" - Buzz: HIGH (65% BEARISH)\n3. "Retail fear/greed oscillator indicates strong FOMO buying in tech chips" - Buzz: EXTREME (82% BULLISH)\n\nForwarding sentiment vector metrics to Board Auditor.`
      ],
      auditor: [
        `AUDIT QUALITY REPORT:\n\nVerified code integrity of modules. HTML/CSS/JS components checked successfully:\n- Text elements are strictly mapped using textContent to completely block XSS input vector attempts.\n- CSS animations verified: hardware-accelerated transforms used for smooth card hovers.\n- Visual balance: verified responsive flexbox padding consistency.\n\nAll systems fully compiled. Consensus reached. Release ready!`,
        `NOXUS QUANT BOARD CONSENSUS DIRECTIVE:\n\nBoard meeting concluded. Consensus generated:\n- NVDA: BUY (Score: 84) - Strong technological moat and extreme social buzz offsets short-term RSI overbought parameters. Entry range: $1,135 - $1,150. Take-profit: $1,280. Stop-loss: $1,090.\n- TSLA: HOLD (Score: 50) - Neutral/Bearish indicator alignment. Asset is consolidating below 20-day SMA. Awaiting clear volume breakout before executing trades.`
      ]
    };

    // Pick response based on role and active presets
    const list = mockDb[node.role] || ["Simulated agent computation achieved. Context parsed."];
    const isQuant = goal.toLowerCase().includes("quant") || goal.toLowerCase().includes("trading");
    const response = isQuant ? (list[1] || list[0]) : list[0];

    // Simulate thinking delay before resolving
    setTimeout(() => {
      // If coder, designer, or auditor, generate corresponding vault files in mock mode
      if (!isQuant) {
        if (node.role === "coder") {
          registerArtifact("index.html", getMockHTML());
          registerArtifact("app.js", getMockJS());
        } else if (node.role === "designer") {
          registerArtifact("styles.css", getMockCSS());
        } else if (node.role === "auditor") {
          registerArtifact("audit_log.txt", getMockAuditLog());
        }
      } else {
        if (node.role === "coder") {
          registerArtifact("app_backtest.py", getMockPythonScript());
        } else if (node.role === "auditor") {
          registerArtifact("consensus_report.md", getMockConsensusReport());
        }
      }

      resolve(response);
    }, 1500);
  });
}

// ============================================================
// 9. LOGGING & TYPEWRITER GRAPHICS
// ============================================================

// Adds a system message in the right log panel
function logSystem(msg) {
  const container = document.getElementById("console-logs");
  const log = document.createElement("div");
  log.className = "log-message system-log";
  
  const time = new Date().toTimeString().split(" ")[0];
  log.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
  
  container.appendChild(log);
  container.scrollTop = container.scrollHeight;
}

// Prints agent response with dynamic colors
function typewriterLog(role, agentName, text) {
  const container = document.getElementById("console-logs");
  const log = document.createElement("div");
  log.className = `log-message ${role}-log`;
  
  const time = new Date().toTimeString().split(" ")[0];
  log.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-agent">${agentName}:</span> <span class="log-body"></span>`;
  container.appendChild(log);
  container.scrollTop = container.scrollHeight;

  const bodySpan = log.querySelector(".log-body");
  
  // High-performance typewriter text simulation
  let index = 0;
  const speed = 10; // ms per char
  
  function type() {
    if (index < text.length) {
      bodySpan.textContent += text.charAt(index);
      index++;
      container.scrollTop = container.scrollHeight;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// ============================================================
// 10. GENERATED FILES (VAULT STORAGE) OPERATIONS
// ============================================================
function registerArtifact(name, content) {
  // Prevent duplicate files, overwrite
  const idx = swarmState.artifacts.findIndex(a => a.name === name);
  if (idx > -1) {
    swarmState.artifacts[idx].content = content;
  } else {
    swarmState.artifacts.push({ name, content });
  }

  logSystem(`📦 New deliverable archived in vault: [${name}]`);
  renderArtifactsUI();
}

// Renders the file tab list in Vault
function renderArtifactsUI() {
  const container = document.getElementById("artifacts-list");
  container.innerHTML = "";

  if (swarmState.artifacts.length === 0) {
    container.innerHTML = `<div class="no-artifacts">No files have been generated by the swarm yet. Run the pipeline to produce code outputs.</div>`;
    document.getElementById("artifact-name").textContent = "no_active_file.txt";
    document.getElementById("artifact-content").textContent = "Select a generated file from the list above to view its contents.";
    return;
  }

  swarmState.artifacts.forEach(art => {
    const tab = document.createElement("div");
    tab.className = `artifact-tab ${swarmState.activeArtifactId === art.name ? "active" : ""}`;
    tab.textContent = art.name;
    
    tab.addEventListener("click", () => {
      swarmState.activeArtifactId = art.name;
      renderArtifactsUI();
      
      // Update preview text
      document.getElementById("artifact-name").textContent = art.name;
      document.getElementById("artifact-content").textContent = art.content;
    });

    container.appendChild(tab);
  });

  // Set first artifact active by default if none selected
  if (!swarmState.activeArtifactId && swarmState.artifacts.length > 0) {
    swarmState.activeArtifactId = swarmState.artifacts[0].name;
    document.getElementById("artifact-name").textContent = swarmState.artifacts[0].name;
    document.getElementById("artifact-content").textContent = swarmState.artifacts[0].content;
    renderArtifactsUI();
  }
}

// ============================================================
// 11. PRESETS & JSON UTILITIES
// ============================================================
function loadPreset(presetName) {
  const preset = PRESETS[presetName];
  if (!preset) return;

  clearWorkspace();
  document.getElementById("swarm-prompt").value = preset.prompt;

  // Add Preset Nodes
  preset.nodes.forEach(node => {
    addNewNode(node.role, node.x, node.y, node.id);
    
    // Sync state names
    const sNode = swarmState.nodes.find(n => n.id === node.id);
    if (sNode) {
      sNode.name = node.name;
      sNode.prompt = node.prompt;
      
      // Sync DOM inputs
      const nameInput = document.getElementById(`input-name-${node.id}`);
      const promptInput = document.getElementById(`input-prompt-${node.id}`);
      if (nameInput) nameInput.value = node.name;
      if (promptInput) promptInput.value = node.prompt;
      
      const titleText = document.getElementById(`node-name-text-${node.id}`);
      if (titleText) titleText.textContent = node.name;
    }
  });

  // Add Preset Connections
  preset.connections.forEach(conn => {
    createNewConnection(conn.fromId, conn.toId);
  });

  logSystem(`Preset [${presetName}] loaded successfully.`);
}

// Export canvas pipeline configuration as a JSON file
function exportSwarmJSON() {
  const payload = {
    prompt: document.getElementById("swarm-prompt").value,
    nodes: swarmState.nodes,
    connections: swarmState.connections
  };

  const str = JSON.stringify(payload, null, 2);
  const blob = new Blob([str], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `swarmforge_config_${Date.now().toString().slice(-4)}.json`;
  a.click();
  
  logSystem("Exported swarm configuration JSON.");
}

// Import swarm configuration from JSON
function importSwarmJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      clearWorkspace();

      if (data.prompt) {
        document.getElementById("swarm-prompt").value = data.prompt;
      }

      if (data.nodes) {
        data.nodes.forEach(n => {
          addNewNode(n.role, n.x, n.y, n.id);
          
          const sNode = swarmState.nodes.find(sn => sn.id === n.id);
          if (sNode) {
            sNode.name = n.name;
            sNode.prompt = n.prompt;
            
            // Sync inputs
            document.getElementById(`input-name-${n.id}`).value = n.name;
            document.getElementById(`input-prompt-${n.id}`).value = n.prompt;
            document.getElementById(`node-name-text-${n.id}`).textContent = n.name;
          }
        });
      }

      if (data.connections) {
        data.connections.forEach(c => {
          createNewConnection(c.fromId, c.toId);
        });
      }

      logSystem("Swarm configuration successfully imported from JSON.");
    } catch (err) {
      alert("Invalid JSON file layout. Failed to parse.");
    }
  };
  reader.readAsText(file);
}

// Promise delay helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 12. HIGH-FIDELITY SOURCE CODE MOCKS FOR SANDBOX VAULT
// ============================================================
function getMockHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Kanban Flow</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="kanban-app">
    <header class="kanban-header">
      <h2>⚡ KanbanFlow Workspace</h2>
      <button class="btn-add-task" onclick="triggerNewTask()">+ Create Card</button>
    </header>
    <main class="kanban-board">
      <!-- Todo Column -->
      <div class="kanban-column" id="col-todo" ondragover="allowDrop(event)" ondrop="handleDrop(event, 'todo')">
        <h3 class="column-title">Backlog Tasks <span class="counter">2</span></h3>
        <div class="column-list">
          <div class="task-card" draggable="true" ondragstart="handleDragStart(event, 't1')" id="task-t1">
            <h4>Optimize API Crumb Fetch</h4>
            <p>Resolve query validation rejections on Yahoo endpoint routes.</p>
            <span class="tag-badge badge-high">High</span>
          </div>
          <div class="task-card" draggable="true" ondragstart="handleDragStart(event, 't2')" id="task-t2">
            <h4>Micro-interactions polish</h4>
            <p>Implement HSL color switches and pulse glows on hover.</p>
            <span class="tag-badge badge-med">Medium</span>
          </div>
        </div>
      </div>
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>`;
}

function getMockCSS() {
  return `/* KanbanFlow Glassmorphic Design System */
:root {
  --bg-primary: #0a0c10;
  --bg-column: rgba(22, 28, 42, 0.4);
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.05);
  
  --accent-teal: hsl(174, 90%, 41%);
  --accent-purple: hsl(263, 90%, 51%);
  --text-main: #f8fafc;
  --text-sub: #94a3b8;
}

body {
  background: var(--bg-primary);
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  margin: 0;
  padding: 20px;
}

.kanban-board {
  display: flex;
  gap: 20px;
  margin-top: 24px;
}

.kanban-column {
  background: var(--bg-column);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 16px;
  width: 320px;
  min-height: 500px;
  backdrop-filter: blur(10px);
}

.task-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: grab;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-purple);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.15);
}

.tag-badge {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 700;
  text-transform: uppercase;
}`;
}

function getMockJS() {
  return `// KanbanFlow Drag and Drop State Controller
let draggedTaskId = null;

function handleDragStart(event, taskId) {
  draggedTaskId = taskId;
  event.dataTransfer.setData("text/plain", taskId);
  event.target.classList.add("dragging");
}

function allowDrop(event) {
  event.preventDefault();
}

function handleDrop(event, columnId) {
  event.preventDefault();
  const id = event.dataTransfer.getData("text");
  const card = document.getElementById(id);
  
  if (card) {
    card.classList.remove("dragging");
    const list = event.target.closest(".kanban-column").querySelector(".column-list");
    list.appendChild(card);
    console.log(\`Task \${id} moved successfully to column \${columnId}.\`);
  }
}

function triggerNewTask() {
  const title = prompt("Enter Task Title:");
  if (title) {
    const list = document.querySelector(".column-list");
    const id = "task-" + Date.now();
    const card = document.createElement("div");
    card.className = "task-card";
    card.id = id;
    card.draggable = true;
    card.innerHTML = \`
      <h4>\${title}</h4>
      <p>Configure instructions in task panel.</p>
      <span class="tag-badge badge-med">Medium</span>
    \`;
    card.addEventListener("dragstart", (e) => handleDragStart(e, id));
    list.appendChild(card);
  }
}`;
}

function getMockAuditLog() {
  return `=== SWARMFORGE AUDIT COMPILATION LOG ===
[SECURITY EVALUATION: PASSED]
- Checked index.html: Verified all task creation handles use escape wrappers.
- Input validation: verified user text fields bind successfully to textContent, completely blocking raw innerHTML injections.
- CORS Compliance: Background worker relay setup confirmed for all API endpoints.

[VISUAL SYSTEM COMPLIANCE: PASSED]
- Verified CSS custom properties load HSL neon vectors cleanly.
- Grid responsiveness test: successfully matches auto-fit repeat templates on dynamic screen resize.
- Animations evaluated: transition states perform in optimal GPU rendering threads.

Swarm consensus reached successfully. Ready for deployment.`;
}

function getMockPythonScript() {
  return `import pandas as pd
import numpy as np

def calculate_sma(prices, window=20):
    return prices.rolling(window=window).mean()

def calculate_rsi(prices, window=14):
    deltas = np.diff(prices)
    seed = deltas[:window+1]
    up = seed[seed >= 0].sum()/window
    down = -seed[seed < 0].sum()/window
    rs = up/down
    rsi = np.zeros_like(prices)
    rsi[:window] = 100. - 100./(1. + rs)

    for i in range(window, len(prices)):
        delta = deltas[i-1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta

        up = (up * (window - 1) + upval) / window
        down = (down * (window - 1) + downval) / window
        rs = up/down
        rsi[i] = 100. - 100./(1. + rs)
        
    return rsi

def evaluate_consensus(ticker, prices, sentiment_score):
    sma = calculate_sma(prices)
    rsi = calculate_rsi(prices)
    
    last_price = prices.iloc[-1]
    last_sma = sma.iloc[-1]
    last_rsi = rsi.iloc[-1]
    
    verdict = "HOLD"
    score = 50
    
    # Quantitative parameters checking
    if last_price > last_sma and last_rsi < 70 and sentiment_score > 0.6:
        verdict = "BUY"
        score = 80 + int(sentiment_score * 10)
    elif last_price < last_sma or last_rsi > 80:
        verdict = "SELL"
        score = 20 + int(last_rsi / 5)
        
    return {
        "ticker": ticker,
        "price": last_price,
        "sma_20": last_sma,
        "rsi_14": last_rsi,
        "sentiment": sentiment_score,
        "verdict": verdict,
        "score": score
    }`;
}

function getMockConsensusReport() {
  return `# Noxus Quant Committee Consensus Report

This dossier synthesizes market technical factors, fundamental pricing, and public social buzz indices.

## Asset Allocations Consensus

| Asset | Spot Price | SMA-20 Gap | RSI-14 | Sentiment | Board Verdict | Consensus Score |
|---|---|---|---|---|---|---|
| **NVDA** | $1,154.20 | +6.8% (Bullish) | 74 (Overbought) | 94% (High) | **BUY** | **84 / 100** |
| **TSLA** | $178.50 | -3.1% (Bearish) | 42 (Neutral) | 35% (Weak) | **HOLD** | **50 / 100** |

---

## Strategic Debater Comments

### 📈 Technical Analyst Agent
> "NVDA has achieved a massive breakout above its 20-day SMA, indicating extremely powerful long-term velocity. While the RSI is sitting at 74 (overbought boundary), high trading volume supports continuation vectors."

### 📊 Fundamentalist Agent
> "Tesla margins are compressing, and cash flows consolidations are visible. NVDA, however, continues to leverage a near-monopoly on server-side quantitative hardware, justifying trading premiums."

### 🗣️ Crowd Sentiment Agent
> "Public indices report maximum attention focus on tech chips. Social media sentiment buzz logs outline significant retail buy FOMO, maintaining strong upward momentum vectors."
`;
}
