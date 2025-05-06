    const documents = [];

    class Document {
    constructor(id, title, encryptedContent, ownerId) {
        this.id = id;
        this.title = title;
        this.encryptedContent = encryptedContent;
        this.ownerId = ownerId;
        this.collaborators = [];
        this.versions = [{
        id: Date.now().toString(),
        encryptedContent,
        timestamp: new Date(),
        author: ownerId,
        message: 'Initial version'
        }];
        this.branches = {
        master: {
            head: this.versions[0].id,
            versions: [this.versions[0].id]
        }
        };
        this.currentBranch = 'master';
    }

    addVersion(encryptedContent, author, message) {
        const version = {
        id: Date.now().toString(),
        encryptedContent,  // IPFS CID
        timestamp: new Date(),
        author,
        message
        };
        this.versions.push(version);
        this.encryptedContent = encryptedContent;
        this.branches[this.currentBranch].versions.push(version.id);
        this.branches[this.currentBranch].head = version.id;
        return version;
    }

    createBranch(name, fromVersion) {
        const sourceVersion = fromVersion || this.branches[this.currentBranch].head;
        this.branches[name] = {
        head: sourceVersion,
        versions: [...this.branches[this.currentBranch].versions.filter(
            v => this.versions.findIndex(ver => ver.id === v) <= this.versions.findIndex(ver => ver.id === sourceVersion)
        )]
        };
        return this.branches[name];
    }

    switchBranch(name) {
        if (!this.branches[name]) throw new Error(`Branch ${name} does not exist`);
        this.currentBranch = name;
        const headVersionId = this.branches[name].head;
        const headVersion = this.versions.find(v => v.id === headVersionId);
        this.encryptedContent = headVersion.encryptedContent;
        return headVersion;
    }

    addCollaborator(userId, permissions = ['read']) {
        this.collaborators.push({ userId, permissions });
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
        encryptedContent: this.encryptedContent,
        currentBranch: this.currentBranch,
        versions: this.versions,
        };
    }

    static create(title, encryptedContent, ownerId) {
        const id = Date.now().toString();
        const document = new Document(id, title, encryptedContent, ownerId);
        documents.push(document);
        return document;
    }

    static findById(id) {
        return documents.find(doc => doc.id === id);
    }
    }

    module.exports = Document;
