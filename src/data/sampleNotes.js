export const SAMPLE_STUDY_NOTES = [
  {
    id: 'sample-dsa',
    title: 'Data Structures: Balanced Trees & Hashing',
    topic: 'Data Structures & Algorithms',
    tags: ['Trees', 'AVL Trees', 'Red-Black', 'Hash Tables', 'Time Complexity'],
    content: `# Data Structures & Algorithms: Balanced Trees and Hash Tables

## 1. Balanced Binary Search Trees (BBST)
A standard Binary Search Tree (BST) can degenerate into an O(N) linear linked-list when keys are inserted in sorted order. Self-balancing binary search trees maintain an O(log N) height invariant through tree rotations.

### AVL Trees
- **Balance Factor Invariant**: For every node in the tree, the height difference between its left and right subtrees must be at most 1: |Height(Left) - Height(Right)| <= 1.
- **Rotations**: AVL trees perform single (LL, RR) or double (LR, RL) rotations upon insertion and deletion to restore balance.
- **Lookup vs Mutation**: AVL trees are more rigidly balanced than Red-Black trees. As a result, lookups are faster in AVL trees (smaller constant factor), but insertions and deletions require more rotations.

### Red-Black Trees
- **Properties**:
  1. Every node is either red or black.
  2. The root node is always black.
  3. Red nodes cannot have red children (no two consecutive red nodes on any root-to-leaf path).
  4. Every simple path from a node to descendant leaf null pointers contains the exact same number of black nodes (Black-Height).
  5. All leaves (NIL nodes) are black.
- **Application**: Red-Black trees power the C++ Standard Template Library (std::map, std::set) and Linux kernel Virtual Memory Areas (vma_area_struct) due to faster insertion/deletion guarantees (at most 2 rotations on insert, at most 3 on delete).

## 2. Hash Tables & Collision Resolution
A Hash Table maps keys to values using a hash function h(k) = k mod M.

### Separate Chaining
- Each bucket in the table points to a linked list (or balanced tree if bucket size exceeds threshold like in Java 8 HashMap).
- Degradation: Under poor hash distribution, worst-case lookup degrades to O(N). Under uniform hashing, average lookup is O(1 + alpha), where alpha = N / M (load factor).

### Open Addressing
- All elements reside directly within the hash table array.
- **Linear Probing**: P(k, i) = (h(k) + i) mod M. Suffers from primary clustering, where long contiguous runs of occupied slots increase probe lengths.
- **Quadratic Probing**: P(k, i) = (h(k) + c1*i + c2*i^2) mod M. Eliminates primary clustering but suffers from secondary clustering.
- **Double Hashing**: P(k, i) = (h1(k) + i * h2(k)) mod M. Provides near-ideal uniform probe distribution provided h2(k) is coprime to table size M.
- **Load Factor Limit**: Open addressing performance plummets as alpha approaches 0.7 to 0.8; resizing must occur before reaching capacity.`
  },
  {
    id: 'sample-os',
    title: 'Operating Systems: Virtual Memory & Concurrency',
    topic: 'Operating Systems',
    tags: ['Virtual Memory', 'Paging', 'Deadlocks', 'Semaphores', 'TLB'],
    content: `# Operating Systems: Virtual Memory, Paging, and Concurrency

## 1. Virtual Memory Architecture
Virtual memory creates the abstraction of a vast, contiguous address space for each process while physical DRAM may be fragmented and shared.

### Hardware Address Translation & Paging
- **MMU & Page Tables**: The Memory Management Unit (MMU) translates virtual addresses to physical frame numbers using page tables.
- **Address Breakdown**: A 32-bit address with 4 KB pages uses 20 bits for the Virtual Page Number (VPN) and 12 bits for Page Offset (2^12 = 4096 bytes).
- **Multi-Level Page Tables**: Prevent linear page tables from consuming gigabytes of contiguous RAM by paging the page table itself. Unmapped virtual memory regions consume zero physical memory.
- **TLB (Translation Lookaside Buffer)**: An on-chip associative cache storing recent VPN-to-PFN mappings. A TLB miss requires walking the page table in main memory. A context switch flushes non-global TLB entries unless ASIDs (Address Space Identifiers) are supported.

### Page Replacement Algorithms
- **FIFO**: Experiences Belady's Anomaly where increasing the number of page frames leads to more page faults.
- **LRU (Least Recently Used)**: Optimal stack algorithm, but expensive in pure hardware.
- **Clock / Second Chance Algorithm**: Approximates LRU using a reference bit and circular pointer queue.

## 2. Concurrency, Mutexes, and Deadlocks

### Critical Section Problem
To prevent race conditions, concurrent access to shared resources must guarantee:
1. **Mutual Exclusion**: Only one thread inside the critical section at a time.
2. **Progress**: Selection of next entering thread cannot be postponed indefinitely.
3. **Bounded Waiting**: Bound exists on how many times others can enter before a request is granted.

### Coffman Conditions for Deadlock
Deadlock occurs if and only if all four conditions hold simultaneously:
1. **Mutual Exclusion**: Non-shareable resource holding.
2. **Hold and Wait**: Thread holds at least one resource while waiting to acquire others.
3. **No Preemption**: Resources cannot be forcibly taken from a thread.
4. **Circular Wait**: A closed chain of threads exists such that each thread holds a resource requested by the next.`
  },
  {
    id: 'sample-ml',
    title: 'Machine Learning: Transformers & Attention Mechanisms',
    topic: 'Machine Learning',
    tags: ['Transformers', 'Attention', 'Self-Attention', 'Embeddings', 'Positional Encoding'],
    content: `# Machine Learning: Transformers, Attention, and Large Language Models

## 1. The Scaled Dot-Product Attention
The cornerstone of the modern Transformer architecture (Vaswani et al., 2017) is Scaled Dot-Product Attention:
Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V

### Architectural Components
- **Query (Q), Key (K), Value (V)**: Linear projections of the input representations X via learned projection weights W_q, W_k, W_v.
- **Scaling Factor sqrt(d_k)**: For large values of d_k, dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. Dividing by sqrt(d_k) counteracts this effect.
- **Multi-Head Attention (MHA)**: Computes attention h times in parallel with distinct learned parameter matrices, allowing the model to jointly attend to information from different representation subspaces and positions.

## 2. Positional Encodings & Causal Masking
Because standard Transformer self-attention is an inherently permutation-equivariant operation over sets, sequence order must be injected explicitly.

### Sinusoidal Positional Encoding
- Uses sine and cosine functions of different frequencies:
  PE(pos, 2i) = sin(pos / 10000^(2i / d_model))
  PE(pos, 2i + 1) = cos(pos / 10000^(2i / d_model))
- Allows the model to easily learn to attend by relative positions because for any fixed offset k, PE(pos + k) can be represented as a linear function of PE(pos).

### Rotary Position Embedding (RoPE)
- Modern LLMs (LLaMA, Mistral, GPT-4) employ RoPE, encoding relative positional information by multiplying keys and queries with an orthogonal rotation matrix in 2D block slices.

### Autoregressive Causal Masking
- Decoder-only LLMs apply an upper-triangular mask with -infinity values before softmax to ensure that prediction for position t can depend only on known outputs at positions strictly less than t.`
  }
];

