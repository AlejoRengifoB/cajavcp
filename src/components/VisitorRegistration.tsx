import { useState, useEffect } from 'react';
import { Guardian, Child, Individual } from '../types';
import { store } from '../store';
import { UserPlus, Search, Plus, Trash2, CheckCircle, FileSignature, Users, User, X } from 'lucide-react';

interface Props {
  onStartWaiver: (guardian: Guardian, children: Child[], useAttractions: { guardian: boolean; childIds: string[] }) => void;
  onStartIndividualWaiver: (individual: Individual) => void;
}

type SearchResultItem = {
  type: 'guardian' | 'individual';
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  waiverSigned: boolean;
};

export function VisitorRegistration({ onStartWaiver, onStartIndividualWaiver }: Props) {
  const [mode, setMode] = useState<'search' | 'new' | 'individual'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [allPeople, setAllPeople] = useState<SearchResultItem[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<SearchResultItem[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<SearchResultItem | null>(null);
  const [foundChildren, setFoundChildren] = useState<Child[]>([]);

  // Guardian form
  const [gName, setGName] = useState('');
  const [gIdNumber, setGIdNumber] = useState('');
  const [gPhone, setGPhone] = useState('');

  // Children
  const [children, setChildren] = useState<{ fullName: string; age: string }[]>([]);

  // Attraction usage
  const [guardianUsesAttractions, setGuardianUsesAttractions] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [newChildAttractions, setNewChildAttractions] = useState<boolean[]>([]);

  // Individual form
  const [iName, setIName] = useState('');
  const [iIdNumber, setIIdNumber] = useState('');
  const [iPhone, setIPhone] = useState('');
  const [iAge, setIAge] = useState('');

  const [message, setMessage] = useState('');

  // Load all people when entering search mode
  useEffect(() => {
    if (mode === 'search') {
      loadAllPeople();
    }
  }, [mode]);

  const loadAllPeople = () => {
    const guardians = store.getGuardians();
    const individuals = store.getIndividuals();
    
    const people: SearchResultItem[] = [
      ...guardians.map(g => ({
        type: 'guardian' as const,
        id: g.id,
        fullName: g.fullName,
        idNumber: g.idNumber,
        phone: g.phone,
        waiverSigned: g.waiverSigned,
      })),
      ...individuals.map(i => ({
        type: 'individual' as const,
        id: i.id,
        fullName: i.fullName,
        idNumber: i.idNumber,
        phone: i.phone,
        waiverSigned: i.waiverSigned,
      })),
    ];

    // Sort by name
    people.sort((a, b) => a.fullName.localeCompare(b.fullName));
    setAllPeople(people);
    setFilteredPeople(people);
  };

  // Filter people based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPeople(allPeople);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = allPeople.filter(p => 
        p.fullName.toLowerCase().includes(term) || 
        p.idNumber.toLowerCase().includes(term)
      );
      setFilteredPeople(filtered);
    }
  }, [searchTerm, allPeople]);

  const handleSelectPerson = (person: SearchResultItem) => {
    setSelectedPerson(person);
    if (person.type === 'guardian') {
      const ch = store.getChildrenByGuardian(person.id);
      setFoundChildren(ch);
      setSelectedChildIds(ch.map(c => c.id));
    } else {
      setFoundChildren([]);
      setSelectedChildIds([]);
    }
    setGuardianUsesAttractions(false);
  };

  const handleBackToSearch = () => {
    setSelectedPerson(null);
    setFoundChildren([]);
    setSelectedChildIds([]);
    setGuardianUsesAttractions(false);
  };

  const addChildField = () => {
    setChildren([...children, { fullName: '', age: '' }]);
    setNewChildAttractions([...newChildAttractions, true]);
  };

  const removeChildField = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
    setNewChildAttractions(newChildAttractions.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: 'fullName' | 'age', value: string) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const handleNewRegistration = () => {
    if (!gName.trim() || !gIdNumber.trim() || !gPhone.trim()) {
      setMessage('Complete todos los campos del tutor.');
      return;
    }

    // Check if guardian already exists
    const existing = store.findGuardianByIdNumber(gIdNumber.trim());
    if (existing) {
      setMessage('Ya existe un tutor con esa cédula. Use la búsqueda.');
      return;
    }

    const guardian = store.addGuardian({
      fullName: gName.trim(),
      idNumber: gIdNumber.trim(),
      phone: gPhone.trim(),
    });

    const savedChildren: Child[] = [];
    const validChildren = children.filter(c => c.fullName.trim() && c.age);
    validChildren.forEach(c => {
      const child = store.addChild({
        fullName: c.fullName.trim(),
        age: parseInt(c.age),
        guardianId: guardian.id,
      });
      savedChildren.push(child);
    });

    const attractionChildIds = savedChildren
      .filter((_, i) => newChildAttractions[i])
      .map(c => c.id);

    onStartWaiver(guardian, savedChildren, {
      guardian: guardianUsesAttractions,
      childIds: attractionChildIds,
    });
  };

  const handleIndividualRegistration = () => {
    if (!iName.trim() || !iIdNumber.trim() || !iPhone.trim() || !iAge) {
      setMessage('Complete todos los campos de la persona individual.');
      return;
    }

    const age = parseInt(iAge);
    if (age < 1 || age > 120) {
      setMessage('Por favor ingrese una edad válida.');
      return;
    }

    // Check if individual already exists
    const existingIndividual = store.findIndividualByIdNumber(iIdNumber.trim());
    if (existingIndividual) {
      // Use existing individual
      onStartIndividualWaiver(existingIndividual);
      return;
    }

    // Check if already exists as guardian
    const existingGuardian = store.findGuardianByIdNumber(iIdNumber.trim());
    if (existingGuardian) {
      setMessage('Ya existe un registro con esa cédula como tutor. Use la búsqueda.');
      return;
    }

    const individual = store.addIndividual({
      fullName: iName.trim(),
      idNumber: iIdNumber.trim(),
      phone: iPhone.trim(),
      age,
    });

    onStartIndividualWaiver(individual);
  };

  const handleExistingRegistration = () => {
    if (!selectedPerson) return;
    
    if (selectedPerson.type === 'individual') {
      const individual = store.findIndividualByIdNumber(selectedPerson.idNumber);
      if (individual) {
        onStartIndividualWaiver(individual);
      }
    } else {
      const guardian = store.findGuardianByIdNumber(selectedPerson.idNumber);
      if (guardian) {
        onStartWaiver(guardian, foundChildren, {
          guardian: guardianUsesAttractions,
          childIds: selectedChildIds,
        });
      }
    }
  };

  const toggleChildSelection = (id: string) => {
    setSelectedChildIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetIndividualForm = () => {
    setIName('');
    setIIdNumber('');
    setIPhone('');
    setIAge('');
    setMessage('');
  };

  const resetGuardianForm = () => {
    setGName('');
    setGIdNumber('');
    setGPhone('');
    setChildren([]);
    setGuardianUsesAttractions(false);
    setNewChildAttractions([]);
    setMessage('');
  };

  const handleModeChange = (newMode: 'search' | 'new' | 'individual') => {
    setMode(newMode);
    setMessage('');
    setSearchTerm('');
    setSelectedPerson(null);
    setFoundChildren([]);
    if (newMode === 'individual') {
      resetGuardianForm();
    } else if (newMode === 'new') {
      resetIndividualForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-3 rounded-2xl shadow-lg shadow-pink-200 animate-pulse">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">Registro de Visitantes</h2>
          <p className="text-purple-600 text-sm font-medium">Registre tutores, niños o personas individuales</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleModeChange('new')}
          className={`flex-1 min-w-[140px] py-3.5 rounded-2xl font-bold text-base transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
            mode === 'new'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-300'
              : 'bg-white text-pink-600 border-2 border-pink-200 hover:border-pink-400'
          }`}
        >
          <Users className="w-5 h-5" />
          Tutor + Niños
        </button>
        <button
          onClick={() => handleModeChange('individual')}
          className={`flex-1 min-w-[140px] py-3.5 rounded-2xl font-bold text-base transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
            mode === 'individual'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-300'
              : 'bg-white text-cyan-600 border-2 border-cyan-200 hover:border-cyan-400'
          }`}
        >
          <User className="w-5 h-5" />
          Persona Individual
        </button>
        <button
          onClick={() => handleModeChange('search')}
          className={`flex-1 min-w-[140px] py-3.5 rounded-2xl font-bold text-base transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
            mode === 'search'
              ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-300'
              : 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-400'
          }`}
        >
          <Search className="w-5 h-5" />
          Buscar Existente
        </button>
      </div>

      {message && (
        <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium border border-amber-200">
          {message}
        </div>
      )}

      {mode === 'search' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {!selectedPerson ? (
            <>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                Buscar Persona
              </h3>
              <p className="text-gray-500 text-sm">
                Escriba un nombre o número de cédula para filtrar. Se muestran todas las personas registradas.
              </p>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o cédula..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-lg"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Results List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredPeople.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No se encontraron personas</p>
                  </div>
                ) : (
                  filteredPeople.map(person => (
                    <button
                      key={`${person.type}-${person.id}`}
                      onClick={() => handleSelectPerson(person)}
                      className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${person.type === 'guardian' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                          {person.type === 'guardian' ? (
                            <Users className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{person.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {person.idNumber} • {person.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          person.type === 'guardian' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {person.type === 'guardian' ? 'Tutor' : 'Individual'}
                        </span>
                        {person.waiverSigned && (
                          <FileSignature className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {allPeople.length > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  Mostrando {filteredPeople.length} de {allPeople.length} personas registradas
                </p>
              )}
            </>
          ) : (
            // Selected person detail
            <div className="space-y-4">
              <button
                onClick={handleBackToSearch}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Volver a la búsqueda
              </button>

              <div className={`rounded-xl p-4 border ${
                selectedPerson.type === 'guardian' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={`w-5 h-5 ${
                    selectedPerson.type === 'guardian' ? 'text-emerald-600' : 'text-blue-600'
                  }`} />
                  <span className={`font-bold ${
                    selectedPerson.type === 'guardian' ? 'text-emerald-800' : 'text-blue-800'
                  }`}>
                    {selectedPerson.type === 'guardian' ? 'Tutor Encontrado' : 'Persona Individual Encontrada'}
                  </span>
                </div>
                <p className="text-gray-700"><strong>Nombre:</strong> {selectedPerson.fullName}</p>
                <p className="text-gray-700"><strong>Cédula:</strong> {selectedPerson.idNumber}</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> {selectedPerson.phone}</p>
                {selectedPerson.waiverSigned && (
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    selectedPerson.type === 'guardian' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    <FileSignature className="w-4 h-4" />
                    Consentimiento firmado
                  </p>
                )}
              </div>

              {selectedPerson.type === 'guardian' && foundChildren.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    ¿Quién usará las atracciones?
                  </h4>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guardianUsesAttractions}
                      onChange={e => setGuardianUsesAttractions(e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600 accent-emerald-600"
                    />
                    <span className="text-gray-700 font-medium">{selectedPerson.fullName} (Tutor)</span>
                  </label>
                  {foundChildren.map(child => (
                    <label key={child.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedChildIds.includes(child.id)}
                        onChange={() => toggleChildSelection(child.id)}
                        className="w-5 h-5 rounded text-emerald-600 accent-emerald-600"
                      />
                      <span className="text-gray-700 font-medium">{child.fullName} ({child.age} años)</span>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={handleExistingRegistration}
                disabled={selectedPerson.type === 'guardian' && !guardianUsesAttractions && selectedChildIds.length === 0}
                className={`w-full py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] ${
                  selectedPerson.type === 'individual'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-200'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-200'
                }`}
              >
                <FileSignature className="w-5 h-5" />
                {selectedPerson.waiverSigned ? 'Continuar al Pago' : 'Firmar Consentimiento'}
              </button>
            </div>
          )}
        </div>
      ) : mode === 'individual' ? (
        <div className="space-y-5">
          {/* Individual Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Persona Individual</h3>
            </div>
            <p className="text-gray-500 text-sm -mt-2 mb-2">
              Registre una persona que visitará el parque de forma individual (cualquier edad).
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Nombre Completo</label>
              <input
                value={iName}
                onChange={e => setIName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg"
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Número de Cédula</label>
                <input
                  value={iIdNumber}
                  onChange={e => setIIdNumber(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg"
                  placeholder="Cédula de identidad"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Teléfono</label>
                <input
                  value={iPhone}
                  onChange={e => setIPhone(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg"
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Edad</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={iAge}
                  onChange={e => setIAge(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg"
                  placeholder="Edad"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleIndividualRegistration}
            disabled={!iName.trim() || !iIdNumber.trim() || !iPhone.trim() || !iAge}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FileSignature className="w-5 h-5" />
            Continuar a Firma de Consentimiento
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Guardian Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Datos del Tutor / Responsable Legal</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Nombre Completo</label>
              <input
                value={gName}
                onChange={e => setGName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-lg"
                placeholder="Nombre completo del tutor"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Número de Cédula</label>
                <input
                  value={gIdNumber}
                  onChange={e => setGIdNumber(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-lg"
                  placeholder="Cédula de identidad"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Teléfono</label>
                <input
                  value={gPhone}
                  onChange={e => setGPhone(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-lg"
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 cursor-pointer">
              <input
                type="checkbox"
                checked={guardianUsesAttractions}
                onChange={e => setGuardianUsesAttractions(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-600"
              />
              <span className="text-gray-700 font-medium">El tutor también usará las atracciones</span>
            </label>
          </div>

          {/* Children */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Niños</h3>
              <button
                onClick={addChildField}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-200 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Niño
              </button>
            </div>

            {children.length === 0 && (
              <p className="text-gray-400 text-center py-6">No se han agregado niños. Haga clic en "Agregar Niño" o registre solo al tutor.</p>
            )}

            {children.map((child, i) => (
              <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del Niño</label>
                    <input
                      value={child.fullName}
                      onChange={e => updateChild(i, 'fullName', e.target.value)}
                      className="w-full px-3 py-3 rounded-lg border-2 border-gray-200 focus:border-emerald-500 outline-none text-base"
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Edad</label>
                    <input
                      type="number"
                      min="1"
                      max="17"
                      value={child.age}
                      onChange={e => updateChild(i, 'age', e.target.value)}
                      className="w-full px-3 py-3 rounded-lg border-2 border-gray-200 focus:border-emerald-500 outline-none text-base"
                      placeholder="Años"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 pt-5">
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={newChildAttractions[i]}
                      onChange={e => {
                        const updated = [...newChildAttractions];
                        updated[i] = e.target.checked;
                        setNewChildAttractions(updated);
                      }}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    Atracciones
                  </label>
                  <button
                    onClick={() => removeChildField(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleNewRegistration}
            disabled={!gName.trim() || !gIdNumber.trim() || !gPhone.trim()}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <FileSignature className="w-5 h-5" />
            Continuar a Firma de Consentimiento
          </button>
        </div>
      )}
    </div>
  );
}
