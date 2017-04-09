const exports = {};
exports.UserRestApi = null;
exports.UserService = null;
exports.UserData = null;

{
    /**
     * Wrapper for user REST API (dummy)
     */
    class UserRestApi {
        constructor() {
        }

        getUser() {
            return {
                id: 5,
                name: 'alex',
                surname: 'fen',
                state: 1,
                date: 2048
            }
        }
    }

    goog.addSingletonGetter(UserRestApi);

    exports.UserRestApi = UserRestApi;
}

{
    /**
     * Provides consistency between different views of user data
     */

    /** @typedef {{
     *     id: number,
     *     name: string,
     *     surname: string,
     *     state: number,
     *     date: number
     * }} UserData.ApiViewData
     */

    /** @typedef {{
     *     name: string,
     *     surname: string,
     *     fullName: string,
     *     state: string,
     *     date: number,
     *     formattedDate: string
     * }} UserData.ApplicationViewData
     */

    /** @typedef {{
     *     NAME: string,
     *     fields: Object.<string, UserData.Field>
     * }} UserData.ViewType
     */

    /** @typedef {{
     *     NAME: string,
     *     writeAction: function(*),
     *     readAction: function():*
     * }} UserData.Field
     */

    /** @typedef {{
     *     id: number,
     *     name: string,
     *     surname: string,
     *     state: number,
     *     date: number
     * }} UserData.BaseData
     */

    /* ADD NEW VIEWS HERE */
    /**
     * @const
     * @enum {string}
     */
    const View = {
        API: 'api',
        APPLICATION: 'application'
    };

    /* CHANGE BASE FIELDS HERE, BUT ACT WISELY */
    /**
     * const
     * @enum {string}
     */
    const BaseFieldName = {
        ID: 'id',
        NAME: 'name',
        SURNAME: 'surname',
        STATE: 'state',
        DATE: 'date',
    };

    /* ADD EXTRA FIELDS HERE */
    /**
     * @const
     * @enum {string}
     */
    const AdditionalFieldName = {
        FORMATTED_DATE: 'formattedDate',
        FULL_NAME: 'fullName'
    };

    class UserData {
        constructor() {
            /**
             * @protected
             * @type {UserData.BaseData}
             */
            this.baseData = {};


            /* ADD NEW VIEWS HERE */
            /**
             * @protected
             * @type {Object.<string, UserData.View>}
             */
            this.views = {
                [UserData.View.API]: this.getApiView(),
                [UserData.View.APPLICATION]: this.getApplicationView()
            };
        }

        /**
         * Assuming it's not inheritable
         * @enum {string}
         */
        static get View() {
            return View;
        }

        /**
         * Assuming it's not inheritable
         * @enum {string}
         */
        static get BaseFieldName() {
            return BaseFieldName;
        }

        /**
         * Assuming it's not inheritable
         * @enum {string}
         */
        static get AdditionalFieldName() {
            return AdditionalFieldName;
        }

        /**
         * @public
         * @param {View} view
         * @param {Object.<string,*>} data Object with data that is specific to given view
         */
        setThroughView(view, data) {
            const baseDataPatches = [];
            const viewFields = this.views[view].fields;
            for (let fieldProp in viewFields) {
                if(viewFields.hasOwnProperty(fieldProp)) {
                    const viewField = viewFields[fieldProp];
                    if(viewField && data[viewField.NAME] !== undefined) {
                        baseDataPatches.push(viewField.writeAction(data[viewField.NAME]));
                    }
                }
            }
            //TODO: check patches consistency
            if(baseDataPatches.length) {
                this.baseData = Object.freeze(Object.assign({}, this.baseData, ...baseDataPatches));
            }
        }

        /**
         * @public
         * @param {View} view
         * @return {Object.<string,*>} data Object with data that is specific to given view
         */
        getThroughView(view) {
            const viewFields = this.views[view].fields;
            const viewData = {};
            for(let fieldProp in viewFields) {
                if(viewFields.hasOwnProperty(fieldProp)) {
                    const viewField = viewFields[fieldProp];
                    if(viewField) {
                        viewData[viewField.NAME] = viewField.readAction();
                    }
                }
            }
            //TODO: cache?
            return Object.freeze(viewData);
        }

        /**
         * Extracts string values from enum
         * @protected
         * @param {Object.<string, string>} baseFieldName Enum of base fields
         * @return {Array.<string>}
         */
        getBaseFieldNames(baseFieldName) {
            const fieldNames = [];
            for(let nameProp in baseFieldName) {
                if(baseFieldName.hasOwnProperty(nameProp)) {
                    fieldNames.push(baseFieldName[nameProp]);
                }
            }
            return fieldNames;
        }

        /**
         * @protected
         * @param {UserData.ViewType} view
         * @param {string} fieldName
         */
        deleteFieldFromViewByName(view, fieldName) {
            //TODO: error on no such field
            view.fields[fieldName] = null;
        }

        /**
         * @protected
         * @param {UserData.ViewType} view
         * @param {UserData.Field} field
         */
        alterFieldInView(view, field) {
            //TODO: error on no such field
            view.fields[field.NAME] = field;
        }

        /**
         * @protected
         * @param {UserData.ViewType} view
         * @param {UserData.Field} field
         */
        addFieldToView(view, field) {
            //TODO: error on field already exists
            view.fields[field.NAME] = field
        }

        /**
         * @protected
         * @param {string} name
         * @param {Array.<string>} fieldNames
         */
        getViewBoilerplate(NAME, fieldNames) {
            return {
                NAME,
                fields: this.getFieldsBoilerplate(fieldNames)
            }
        }

        /**
         * @protected
         * @param {Array.<string>} fields
         * @return {Object.<string, UserData.Field>} Map by field.NAME
         */
        getFieldsBoilerplate(fields) {
            const result = {};
            fields.map((fieldName) => {
                result[fieldName] = this.getField(
                    fieldName,
                    this.getDefaultWriteAction(fieldName),
                    this.getDefaultReadAction(fieldName)
                );
            });
            return result;
        }

        /**
         * @protected
         * @param {string} NAME
         * @param {function} writeAction
         * @param {function} readAction
         * @return {UserData.Field}
         */
        getField(NAME, writeAction, readAction) {
            return {NAME, writeAction, readAction};
        }

        /**
         * @protected
         * @return {function(*): {}}
         */
        getDefaultWriteAction(fieldName){
            return (value) => (
                {
                    [fieldName]: value,
                }
            )
        }

        /**
         * @protected
         * @return {function(): *}
         */
        getDefaultReadAction(fieldName) {
            return () => (
                this.baseData[fieldName]
            )
        }

        /* ADD NEW STUFF HERE */
        /**
         * @protected
         * @return {UserData.ViewType}
         */
        getApplicationView() {
            const view = this.getViewBoilerplate(
                UserData.View.APPLICATION,
                this.getBaseFieldNames(UserData.BaseFieldName)
            );

            this.deleteFieldFromViewByName(view, UserData.BaseFieldName.ID);

            this.addFieldToView(
                view,
                this.getField(
                    UserData.AdditionalFieldName.FORMATTED_DATE,
                    this.getFormattedDateWriteAction(),
                    this.getFormattedDateReadAction()
                )
            );

            this.addFieldToView(
                view,
                this.getField(
                    UserData.AdditionalFieldName.FULL_NAME,
                    this.getFullNameWriteAction(),
                    this.getFullNameReadAction()
                )
            );

            this.alterFieldInView(
                view,
                this.getField(
                    UserData.BaseFieldName.STATE,
                    this.getStateWriteActionFromApplicationView(),
                    this.getStateReadActionFromApplicationView()
                )
            );

            return view;
        }

        /**
         * @protected
         * @return {UserData.ViewType}
         */
        getApiView() {
            const view = this.getViewBoilerplate(
                UserData.View.API,
                this.getBaseFieldNames(UserData.BaseFieldName)
            );

            return view;
        }

        /**
         * @protected
         * @return {function(*)}
         */
        getFullNameWriteAction() {
            return (fullName) => {
                let name = fullName.split(' ');
                return {
                    [UserData.BaseFieldName.NAME]: name[0],
                    [UserData.BaseFieldName.SURNAME]: name[1],
                };
            };
        }

        /**
         * @protected
         * @return {function(): string}
         */
        getFullNameReadAction() {
            return () => (
                `${this.baseData[UserData.BaseFieldName.NAME]} ${this.baseData[UserData.BaseFieldName.SURNAME]}`
            )
        }

        /**
         * @protected
         * @return {function(*)}
         */
        getStateWriteActionFromApplicationView() {
            return (value) => {
                let state = 0;
                switch (value) {
                    case 'active':
                        state = 1;
                        break;
                    default:
                        state = 0;
                }
                return {
                    [UserData.BaseFieldName.STATE]: state
                }
            };
        }

        /**
         * @protected
         * @return {function()}
         */
        getStateReadActionFromApplicationView() {
            return () => {
                let state = this.baseData[UserData.BaseFieldName.STATE];
                switch (state) {
                    case 1:
                        state = 'active';
                        break;
                    default:
                        state = 'passive';
                }
                return state;
            }
        }

        /**
         * @protected
         * @return {function(*=): {}}
         */
        getFormattedDateWriteAction() {
            return (value) => ({
                [UserData.BaseFieldName.DATE]: Number(value)
            });
        }

        /**
         * @protected
         * @return {function(): string}
         */
        getFormattedDateReadAction() {
            return () => (
                this.baseData[UserData.BaseFieldName.DATE].toString()
            );
        }
    }

    goog.addSingletonGetter(UserData);

    exports.UserData = UserData;
}

{
    /**
     * Facade for user classes
     */
    const UserRestApi = exports.UserRestApi;
    const UserData = exports.UserData;

    class UserService {
        constructor() {
            this.userRestApi = UserRestApi.getInstance();
            this.userData = UserData.getInstance();
        }

        init() {
            let apiData = this.userRestApi.getUser();
            console.log(apiData);

            this.userData.setThroughView(UserData.View.API, apiData);

            apiData = this.userData.getThroughView(UserData.View.API);
            let appData = this.userData.getThroughView(UserData.View.APPLICATION);

            console.log(apiData);
            console.log(appData);

            let viewPatch = {
                formattedDate: '34',
                state: 'passive',
                fullName: 'fen ok'
            };

            this.userData.setThroughView(UserData.View.APPLICATION, viewPatch);

            apiData = this.userData.getThroughView(UserData.View.API);
            appData = this.userData.getThroughView(UserData.View.APPLICATION);

            console.log(viewPatch);

            console.log(apiData);
            console.log(appData);
        }
    }

    goog.addSingletonGetter(UserService);

    exports.UserService = UserService;
}

{
    //Application
    const UserService = exports.UserService;
    UserService.getInstance().init();
}