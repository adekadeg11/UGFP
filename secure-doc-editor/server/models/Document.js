const documents = [];
const documentStorage = {}; // Simulated persistent storage

class Document {
  constructor(id, title, ipfsCid, ownerId) {
    this.id = id;
    this.title = title;
    this.ipfsCid = ipfsCid;
    this.ownerId = ownerId;
    this.collaborators = [];
    this.versions = ipfsCid ? [{ 
      id: Date.now().toString(), 
      ipfsCid, 
      timestamp: new Date(), 
      author: ownerId, 
      message: 'Initial version' 
    }] : [];
    this.branches = { 
      master: { 
        head: this.versions[0]?.id, 
        versions: this.versions[0] ? [this.versions[0].id] : [] 
      } 
    };
    this.currentBranch = 'master';
    
    // Simulate persistence
    documentStorage[id] = this;
  }

  static loadFromStorage(id) {
    return documentStorage[id];
  }

  addVersion(ipfsCid, author, message) {
    const version = { 
      id: Date.now().toString(), 
      ipfsCid, 
      timestamp: new Date(), 
      author, 
      message 
    };
    this.versions.push(version);
    this.ipfsCid = ipfsCid;
    this.branches[this.currentBranch].versions.push(version.id);
    this.branches[this.currentBranch].head = version.id;
    
    // Persist changes
    documentStorage[this.id] = this;
    return version;
  }

  createBranch(name, fromVersion) {
    const sourceVersion = fromVersion || this.branches[this.currentBranch].head;
    const sourceIndex = this.versions.findIndex(v => v.id === sourceVersion);
    
    this.branches[name] = {
      head: sourceVersion,
      versions: this.versions
        .slice(0, sourceIndex + 1)
        .map(v => v.id)
    };
    
    documentStorage[this.id] = this;
    return this.branches[name];
  }

  switchBranch(name) {
    if (!this.branches[name]) throw new Error(`Branch ${name} does not exist`);
    this.currentBranch = name;
    const headVersionId = this.branches[name].head;
    const headVersion = this.versions.find(v => v.id === headVersionId);
    this.ipfsCid = headVersion.ipfsCid;
    
    documentStorage[this.id] = this;
    return headVersion;
  }

  addCollaborator(userId, permissions = ['read']) {
    const existing = this.collaborators.find(c => c.userId === userId);
    if (existing) {
      existing.permissions = permissions;
    } else {
      this.collaborators.push({ userId, permissions });
    }
    documentStorage[this.id] = this;
  }

  hasPermission(userId, permission) {
    if (this.ownerId === userId) return true;
    const collaborator = this.collaborators.find(c => c.userId === userId);
    if (!collaborator) return false;
    if (collaborator.permissions.includes('admin')) return true;
    if (permission === 'read' && collaborator.permissions.includes('read')) return true;
    if (permission === 'write' && collaborator.permissions.includes('write')) return true;
    return false;
  }

  getMetadataFor(userId) {
    return {
      id: this.id,
      title: this.title,
      encryptedContent: this.ipfsCid,
      currentBranch: this.currentBranch,
      versions: this.versions,
      canEdit: this.hasPermission(userId, 'write'),
      canAdmin: this.hasPermission(userId, 'admin'),
    };
  }

  static create(title, ipfsCid, ownerId) {
    const id = Date.now().toString();
    const document = new Document(id, title, ipfsCid, ownerId);
    documents.push(document);
    documentStorage[id] = document;
    return document;
  }

  static findById(id) {
    return documentStorage[id] || documents.find(doc => doc.id === id);
  }
}

module.exports = Document;