import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  push,
  get,
  update,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

class Fire {
  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyBYxVbWorACCE67JW_DlsralKDDLPZF-_k",
      authDomain: "osfiir-44cc6.firebaseapp.com",
      databaseURL:
        "https://osfiir-44cc6-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "osfiir-44cc6",
      storageBucket: "osfiir-44cc6.appspot.com",
      messagingSenderId: "43718681260",
      appId: "1:43718681260:web:cda85197f57d48d2273509",
      measurementId: "G-SM8FPV84ZH",
    };

    const app = initializeApp(firebaseConfig);
    this.database = getDatabase(app);
    this.auth = getAuth(app);
  }
  async addData(path, newData) {
    try {
      const dataRef = ref(this.database, path);
      const newKey = push(dataRef).key;
      await update(ref(this.database, `${path}/${newKey}`), newData);
      console.log("Data successfully added!");
      return newData;
    } catch (error) {
      console.error("Error adding data: ", error);
      throw error;
    }
  }

  async registerUser(email, password) {
    try {
      let rol = "user";
      const emails = Object.values(await this.getData("/companies"));
      console.log(emails, email);
      emails.forEach((mail) => {
        if (mail.email == email) {
          rol = "company";
          console.log("e ok");
        }
      });

      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      let user = {};
      user.email = userCredential.user.email;
      user.rol = rol;
      console.log(user);
      this.addData("/targ_users", {
        ...user,
        uid: userCredential.user.uid,
      });
      return user; // Return the newly created user object
    } catch (error) {
      console.error("Error registering user: ", error);
      throw error;
    }
  }

  async loginUser_for_targ(email, password) {
    try {
      let rol = "user";
      const emails = Object.values(await this.getData("/companies"));
      console.log(emails, email);
      emails.forEach((mail) => {
        if (mail.email == email) {
          rol = "company";
          console.log("e ok");
        }
      });

      const userCredentials = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      let user = {
        email: userCredentials.user.email,
        rol: rol,
        uid: userCredentials.user.uid,
      };
      console.log(user);

      this.addData("/targ_users", user);

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      console.log("User successfully logged in!");

      // const users = await this.getUserByEmail(
      //   "/targ_users",
      //   userCredential.user.email
      // );
      // console.log("din back: ", users);
      return userCredential.user; // Return the logged-in user object
    } catch (error) {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      console.log("User successfully logged in!2222222222222222");

      const users = await this.getUserByEmail(
        "/targ_users",
        userCredential.user.email
      );

      return users;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      console.log("User successfully logged out!");
    } catch (error) {
      console.error("Error logging out user: ", error);
      return { error };
    }
  }

  // isLoggedIn() {
  //   return currentUser(this.auth) !== null;
  // }

  // getCurrentUser() {
  //   return currentUser(this.auth);
  // }

  getUser() {
    return this.auth;
  }

  getUser1() {
    return this.auth.currentUser;
  }

  async getData(path) {
    try {
      const dataSnapshot = await get(ref(this.database, path));
      return dataSnapshot.val();
    } catch (error) {
      console.error("Error getting data: ", error);
      throw error;
    }
  }

  async updateData(path, newData) {
    try {
      console.log("Data successfully updated!");
      return await update(ref(this.database, path), newData);
    } catch (error) {
      console.error("Error updating data: ", error);
      throw error;
    }
  }

  async deleteData(path) {
    try {
      await remove(ref(this.database, path));
      console.log("Data successfully deleted!");
    } catch (error) {
      console.error("Error deleting data: ", error);
      throw error;
    }
  }

  listenForChanges(path, callback) {
    try {
      const dataRef = ref(this.database, path);
      onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        callback(data);
      });
    } catch (error) {
      console.error("Error listening for changes: ", error);
      throw error;
    }
  }
  async getDocumentByMatricol(path, matricolValue) {
    try {
      const allDocumentsQuery = query(
        ref(this.database, path),
        orderByChild("nr_matricol")
      );

      const querySnapshot = await get(allDocumentsQuery);

      if (querySnapshot.exists()) {
        const documents = querySnapshot.val();

        // Filter documents based on the "nr_matricol" field
        const matchingDocuments = Object.values(documents).filter(
          (document) => document.nr_matricol === matricolValue
        );

        if (matchingDocuments.length > 0) {
          // Return the first matching document
          return matchingDocuments[0];
        } else {
          console.log("Document not found");
          return null;
        }
      } else {
        console.log("No documents found in the collection");
        return null;
      }
    } catch (error) {
      console.error("Error getting document by matricol: ", error);
      throw error;
    }
  }

  async getUserByEmail(path, email) {
    try {
      const allDocumentsQuery = query(
        ref(this.database, path),
        orderByChild("email")
      );

      const querySnapshot = await get(allDocumentsQuery);

      if (querySnapshot.exists()) {
        const documents = querySnapshot.val();

        const matchingDocuments = Object.values(documents).filter(
          (document) => document.email === email
        );

        if (matchingDocuments.length > 0) {
          // Return the first matching document
          return matchingDocuments[0];
        } else {
          console.log("Document not found");
          return null;
        }
      } else {
        console.log("No documents found in the collection");
        return null;
      }
    } catch (error) {
      console.error("Error getting document by matricol: ", error);
      throw error;
    }
  }

  async getUserByEmail2(path, email) {
    try {
      const allDocumentsQuery = query(
        ref(this.database, path),
        orderByChild("email"),
        equalTo(email) // Added 'equalTo' for exact email match
      );

      const querySnapshot = await get(allDocumentsQuery);

      if (querySnapshot.exists()) {
        const documents = querySnapshot.val();
        console.log(documents);
        return documents;
        const matchingDocument = Object.values(documents).find(
          (document) => document.email === email
        ); // Use 'find' for single document

        if (matchingDocument) {
          return matchingDocument;
        } else {
          console.log("Document not found");
          return null;
        }
      } else {
        console.log("No documents found in the collection");
        return null;
      }
    } catch (error) {
      console.error("Error getting document by email: ", error);
      throw error;
    }
  }

  async deleteDocumentByfield(path, field, value) {
    try {
      const allDocumentsQuery = query(
        ref(this.database, path),
        orderByChild(field),
        equalTo(value)
      );

      const querySnapshot = await get(allDocumentsQuery);

      if (querySnapshot.exists()) {
        const documents = querySnapshot.val();
        const documentKeys = Object.keys(documents);

        // Delete each document matching the index value
        await Promise.all(
          documentKeys.map(async (key) => {
            await remove(ref(this.database, `${path}/${key}`));
          })
        );

        console.log("Documents successfully deleted");
        return true;
      } else {
        console.log("No documents found with the specified index");
        return false;
      }
    } catch (error) {
      console.error("Error deleting documents by index: ", error);
      throw error;
    }
  }
  async addCVToDocument(path, newCV) {
    try {
      const documentRef = ref(this.database, path);

      // Get the current value of the "cvs" array
      const dataSnapshot = await get(documentRef);
      const currentCVs = dataSnapshot.val().cvs || [];
      console.log(currentCVs);
      // Add the new CV to the array
      currentCVs.push(newCV);

      // Update the document with the new "cvs" array
      await update(documentRef, { cvs: currentCVs });

      console.log("CV successfully added to document");
      return true;
    } catch (error) {
      console.error("Error adding CV to document: ", error);
      return false;
    }
  }
}

export default Fire;
