import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type DocWithId = DocumentData & { id: string };

export type PersonInput = {
  full_name: string;
  mobile_number: string;
  village: string;
  branch: string;
  role: string;
  pgpd_stage: string;
  assigned_officer_id: string;
  risk_flags?: string[];
  risk_status?: string;
  notes?: string;
};

export async function createPerson(input: PersonInput) {
  const payload = {
    ...input,
    risk_flags: input.risk_flags ?? [],
    risk_status: input.risk_status ?? "Normal",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  return addDoc(collection(db, "primary_people"), payload);
}

export type HouseholdInput = {
  household_name: string;
  primary_person_id: string;
  primary_earning_source?: string;
  seasonality_profile?: string;
  branch: string;
  assigned_officer_id?: string;
};

export async function createPersonWithHousehold(
  person: PersonInput,
  household?: Omit<HouseholdInput, "primary_person_id">
) {
  const batch = writeBatch(db);
  const personRef = doc(collection(db, "primary_people"));
  batch.set(personRef, {
    ...person,
    risk_flags: person.risk_flags ?? [],
    risk_status: person.risk_status ?? "Normal",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  if (household) {
    const householdRef = doc(collection(db, "households"));
    batch.set(householdRef, {
      ...household,
      primary_person_id: personRef.id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  }

  const taskRef = doc(collection(db, "tasks"));
  const dueDate = new Date().toISOString().slice(0, 10);
  batch.set(taskRef, {
    task_title: "Initial financial assessment visit",
    due_date: dueDate,
    status: "Open",
    task_type: "System",
    primary_person_id: personRef.id,
    assigned_officer_id: person.assigned_officer_id,
    source_ref: `primary_people/${personRef.id}`,
    branch: person.branch,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  await batch.commit();
  return personRef;
}

export async function updatePerson(id: string, input: Partial<PersonInput>) {
  const ref = doc(db, "primary_people", id);
  return updateDoc(ref, {
    ...input,
    updated_at: serverTimestamp()
  });
}

export async function getPerson(id: string) {
  const snapshot = await getDoc(doc(db, "primary_people", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as DocumentData) : null;
}

export async function listPeople(branch: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(query(collection(db, "primary_people"), where("branch", "==", branch)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export type ProductInput = {
  product_name: string;
  product_type: string;
  status: string;
  amount: number;
  primary_person_id: string;
  assigned_officer_id: string;
  branch: string;
};

export async function createProduct(input: ProductInput) {
  return addDoc(collection(db, "products"), {
    ...input,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export async function listProducts(branch: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(query(collection(db, "products"), where("branch", "==", branch)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getProduct(id: string) {
  const snapshot = await getDoc(doc(db, "products", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as DocumentData) : null;
}

export type InteractionInput = {
  interaction_title: string;
  interaction_type: string;
  interaction_date: string;
  outcome: string;
  next_action_date?: string;
  primary_person_id: string;
  linked_product_id?: string;
  field_officer_notes?: string;
  branch: string;
  assigned_officer_id: string;
};

export async function createInteraction(input: InteractionInput) {
  return addDoc(collection(db, "interactions"), {
    ...input,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export async function listInteractions(branch: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(query(collection(db, "interactions"), where("branch", "==", branch)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function createTask(input: {
  task_title: string;
  due_date: string;
  status: string;
  task_type: string;
  linked_interaction_id?: string;
  primary_person_id?: string;
  assigned_officer_id: string;
  source_ref?: string;
  branch: string;
}) {
  return addDoc(collection(db, "tasks"), {
    ...input,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export async function listTasksByOfficer(assigned_officer_id: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(
    query(collection(db, "tasks"), where("assigned_officer_id", "==", assigned_officer_id))
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function updateTask(id: string, input: { status: string }) {
  return updateDoc(doc(db, "tasks", id), {
    ...input,
    updated_at: serverTimestamp()
  });
}

export async function createTaskIfMissing(input: {
  task_title: string;
  due_date: string;
  status: string;
  task_type: string;
  linked_interaction_id?: string;
  primary_person_id?: string;
  assigned_officer_id: string;
  source_ref: string;
  branch: string;
  created_by?: string;
}) {
  const snapshot = await getDocs(
    query(collection(db, "tasks"), where("source_ref", "==", input.source_ref))
  );
  const exists = snapshot.docs.some(
    (docSnap) => String(docSnap.data().task_title ?? "") === input.task_title
  );
  if (exists) return null;

  const created = await createTask(input);
  await createAutomationLog({
    action: "task_created",
    source_ref: input.source_ref,
    branch: input.branch,
    created_by: input.created_by,
    details: {
      task_title: input.task_title,
      task_type: input.task_type
    }
  });
  return created;
}

export type UserProfileInput = {
  display_name: string;
  role: string;
  branch: string;
  email?: string;
};

export async function upsertUserProfile(uid: string, input: UserProfileInput) {
  return setDoc(
    doc(db, "users", uid),
    {
      ...input,
      updated_at: serverTimestamp(),
      created_at: serverTimestamp()
    },
    { merge: true }
  );
}

export async function createRecord(collectionName: string, input: Record<string, unknown>) {
  return addDoc(collection(db, collectionName), {
    ...input,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export async function getRecord(collectionName: string, id: string) {
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as DocumentData) : null;
}

export async function updateRecord(
  collectionName: string,
  id: string,
  input: Record<string, unknown>
) {
  return updateDoc(doc(db, collectionName, id), {
    ...input,
    updated_at: serverTimestamp()
  });
}

export async function listRecords(collectionName: string, branch: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where("branch", "==", branch))
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function getHouseholdByPerson(branch: string, personId: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "households"),
      where("branch", "==", branch),
      where("primary_person_id", "==", personId)
    )
  );
  const docSnap = snapshot.docs[0];
  return docSnap ? ({ id: docSnap.id, ...docSnap.data() } as DocumentData) : null;
}

export async function upsertHouseholdForPerson(
  branch: string,
  personId: string,
  input: Omit<HouseholdInput, "primary_person_id" | "branch">
) {
  const snapshot = await getDocs(
    query(
      collection(db, "households"),
      where("branch", "==", branch),
      where("primary_person_id", "==", personId)
    )
  );
  const existing = snapshot.docs[0];
  if (existing) {
    await updateDoc(doc(db, "households", existing.id), {
      ...input,
      updated_at: serverTimestamp()
    });
    return existing.ref;
  }

  return addDoc(collection(db, "households"), {
    ...input,
    branch,
    primary_person_id: personId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export async function listProductsByPerson(branch: string, personId: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "products"),
      where("branch", "==", branch),
      where("primary_person_id", "==", personId)
    )
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function listInteractionsByPerson(
  branch: string,
  personId: string
): Promise<DocWithId[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "interactions"),
      where("branch", "==", branch),
      where("primary_person_id", "==", personId)
    )
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function listTasksByPerson(branch: string, personId: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "tasks"),
      where("branch", "==", branch),
      where("primary_person_id", "==", personId)
    )
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function listTasksByBranch(branch: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(query(collection(db, "tasks"), where("branch", "==", branch)));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function listPeopleAtRisk(branch: string): Promise<DocWithId[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "primary_people"),
      where("branch", "==", branch),
      where("risk_status", "==", "At Risk")
    )
  );
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function countProductsByTypeStatus(
  branch: string,
  product_type: string,
  status: string
) {
  const snapshot = await getCountFromServer(
    query(
      collection(db, "products"),
      where("branch", "==", branch),
      where("product_type", "==", product_type),
      where("status", "==", status)
    )
  );
  return snapshot.data().count;
}

export async function countPeopleByRisk(branch: string, risk_status: string) {
  const snapshot = await getCountFromServer(
    query(
      collection(db, "primary_people"),
      where("branch", "==", branch),
      where("risk_status", "==", risk_status)
    )
  );
  return snapshot.data().count;
}

export async function countTasksByStatus(branch: string, status: string) {
  const snapshot = await getCountFromServer(
    query(
      collection(db, "tasks"),
      where("branch", "==", branch),
      where("status", "==", status)
    )
  );
  return snapshot.data().count;
}

export async function countInteractionsSince(branch: string, sinceDate: string) {
  const snapshot = await getCountFromServer(
    query(
      collection(db, "interactions"),
      where("branch", "==", branch),
      where("interaction_date", ">=", sinceDate)
    )
  );
  return snapshot.data().count;
}

export async function createAutomationLog(input: {
  action: string;
  source_ref: string;
  branch: string;
  created_by?: string;
  details?: Record<string, unknown>;
}) {
  return addDoc(collection(db, "automation_logs"), {
    ...input,
    created_at: serverTimestamp()
  });
}
